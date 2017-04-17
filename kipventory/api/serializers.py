from rest_framework import serializers, pagination
from rest_framework.exceptions import ValidationError
from . import models
from django.contrib.auth.models import User
from django.utils import timezone
import dateutil.parser
from datetime import datetime
from django.db.models import Q, F, Count
from .validators import validate_file_extension


import re, json

from rest_framework.utils.serializer_helpers import BindingDict


class CustomFieldSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    field_type = serializers.ChoiceField(choices=models.FIELD_TYPES)

    class Meta:
        model = models.CustomField
        fields = ('name', 'field_type', 'private', 'asset_tracked', )

    def validate(self, data):
        name = data.get('name', None)
        field_exists = (models.CustomField.objects.filter(name=name).count() > 0)
        if field_exists:
            raise ValidationError({"name": ["A field with name \'{}\' already exists.".format(name)]})
        return data

class AssetSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        custom_fields = None
        user = self.context['request'].user
        if user.is_staff or user.is_superuser:
            custom_fields = models.CustomField.objects.filter(asset_tracked=True)
        else:
            custom_fields = models.CustomField.objects.filter(asset_tracked=True, private=False)

        self.fields['tag'] = serializers.CharField(required=False)

        for custom_field in custom_fields:
            ft = custom_field.field_type
            if ft == "Single":
                self.fields[custom_field.name] = serializers.CharField(required=False, allow_blank=True, default="")
            elif ft == "Multi":
                self.fields[custom_field.name] = serializers.CharField(required=False, allow_blank=True, default="")
            elif ft == "Int":
                self.fields[custom_field.name] = serializers.IntegerField(required=False, default=0)
            elif ft == "Float":
                self.fields[custom_field.name] = serializers.FloatField(required=False, default=0.0)

    def to_representation(self, asset):
        d = {
            "item": asset.item.name,
            "tag": asset.tag,
            "status": asset.status,
        }

        if asset.status == models.LOANED:
            d.update({"loan": LoanSerializer(context=self.context,
                                             instance=asset.loans.filter(quantity_loaned__gt=F('quantity_returned')).get(asset__tag=asset.tag)).data})

        if asset.status == models.DISBURSED:
            d.update({"disbursement": DisbursementSerializer(context=self.context,
                                                             instance=asset.disbursements.first()).data})

        for cv in asset.values.all():
            field_name = cv.field.name
            val = cv.get_value()
            d[field_name] = val
        return d

    def update(self, asset, validated_data):
        asset.tag = validated_data.pop('tag', asset.tag)

        for field_name, value in validated_data.items():
            cv = asset.values.get(field__name=field_name)
            setattr(cv, cv.field.field_type, value)
            cv.save()

        asset.save()
        return asset

class ItemSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        custom_fields = None
        user = self.context['request'].user

        if user.is_staff or user.is_superuser:
            custom_fields = models.CustomField.objects.all()
        else:
            custom_fields = models.CustomField.objects.filter(private=False)

        for custom_field in custom_fields:
            ft = custom_field.field_type
            if ft == "Single":
                self.fields[custom_field.name] = serializers.CharField(required=False, allow_blank=True, default="")
            elif ft == "Multi":
                self.fields[custom_field.name] = serializers.CharField(required=False, allow_blank=True, default="")
            elif ft == "Int":
                self.fields[custom_field.name] = serializers.IntegerField(required=False, default=0)
            elif ft == "Float":
                self.fields[custom_field.name] = serializers.FloatField(required=False, default=0.0)

    name          = serializers.CharField(required=True,  allow_blank=False)
    quantity      = serializers.IntegerField(min_value=0,  required=True)
    model_no      = serializers.CharField(required=False, allow_blank=True, default="")
    description   = serializers.CharField(required=False, allow_blank=True, default="")
    tags          = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False, default=None)
    has_assets    = serializers.BooleanField(required=False)
    minimum_stock = serializers.IntegerField(min_value=0, required=False)

    def to_representation(self, item):
        in_cart = 0
        try:
            ci = models.CartItem.objects.get(item__pk=item.pk)
            in_cart = ci.quantity
        except:
            pass

        d = {
            "name": item.name,
            "quantity": item.quantity,
            "description": item.description,
            "model_no": item.model_no,
            "tags": [tag.name for tag in item.tags.all()],
            "has_assets": item.has_assets,
            "in_cart": in_cart,
            "minimum_stock": item.minimum_stock
        }

        for cv in item.values.all():
            field_name = cv.field.name
            val = cv.get_value()
            d[field_name] = val

        return d

    def to_internal_value(self, data):
        data = super(ItemSerializer, self).to_internal_value(data)

        name = data.get('name', None)
        if name is not None:
            try:
                other_item = models.Item.objects.get(name=name)
                if self.instance:
                    if self.instance.name != name:
                        raise ValidationError({"name": ["An object with this name already exists."]})
                else:
                    raise ValidationError({"name": ["An object with this name already exists."]})
            except models.Item.DoesNotExist:
                # We know this a new item name, and is therefore valid
                pass

        tag_names = data.pop('tags', None)
        if tag_names is not None:
            tags = []
            for tag_name in tag_names:
                if len(tag_name) > 0:
                    tag = None
                    try:
                        tag = models.Tag.objects.get(name=tag_name)
                    except models.Tag.DoesNotExist:
                        tag = models.Tag.objects.create(name=tag_name)
                    tags.append(tag)
        else:
            tags = None

        data.update({"tags": tags})
        return data

    def create(self, validated_data):
        # Get all the intrinsic data fields on the Item model
        name = validated_data.pop('name', "")
        quantity = validated_data.pop('quantity', "")
        model_no = validated_data.pop('model_no', "")
        description = validated_data.pop('description', "")
        has_assets  = validated_data.pop('has_assets', False)
        minimum_stock = validated_data.pop('minimum_stock', 0)

        item = models.Item.objects.create(name=name,
                                          model_no=model_no,
                                          quantity=quantity,
                                          description=description,
                                          has_assets=has_assets,
                                          minimum_stock=minimum_stock)

        tags = validated_data.pop('tags', None)
        if tags is not None:
            for tag in tags:
                item.tags.add(tag)

        for field_name, value in validated_data.items():
            cv = item.values.get(field__name=field_name)
            setattr(cv, cv.field.field_type, value)
            cv.save()

        item.save()
        return item

    def update(self, item, validated_data):
        # Get all the intrinsic data fields on the Item model
        has_assets_old = item.has_assets
        has_assets_new = validated_data.get('has_assets', item.has_assets)

        item.name        = validated_data.pop('name',            item.name)
        item.quantity    = validated_data.pop('quantity',        item.quantity)
        item.model_no    = validated_data.pop('model_no',        item.model_no)
        item.description = validated_data.pop('description',     item.description)
        item.has_assets  = validated_data.pop('has_assets',      item.has_assets)
        item.minimum_stock = validated_data.pop('minimum_stock', item.minimum_stock)

        # only overwrite tags if they were explicitly passed in the request
        tags = validated_data.pop('tags', None)
        if tags is not None:
            item.tags.clear()
            for tag in tags:
                item.tags.add(tag)

        for field_name, value in validated_data.items():
            cv = item.values.get(field__name=field_name)
            setattr(cv, cv.field.field_type, value)
            cv.save()

        # Converting an item from asset-tracked to non-asset-tracked.
        # Delete every asset instance.
        # If any foreign key relations to an Asset exist, they should be set to null.
        # This ensures that any loans/disbursements/backfills may proceed as intended.
        if has_assets_old == True and has_assets_new == False:
            for asset in item.assets.all():
                asset.delete()
            # # We will also group any loans for individual item assets.
            # # That is, if Susan has 3 loans for 3 different assets of this item,
            # # we will merge them into one loan for 3 instances (no assets) of the item.
            # requests = models.Request.objects.all()
            # for request in requests:
            #     loans = request.loans.filter(item__name=item.name, asset=None)
            #     disbursements = request.disbursements.filter(item__name=item.name, asset=None)
            #     total_loaned = 0
            #     total_returned = 0
            #     total_disbursed = 0
            #     for loan in loans:
            #         total_loaned += loan.quantity_loaned
            #         total_returned += loan.quantity_returned
            #         loan.delete()
            #     for disbursement in disbursements:
            #         total_disbursed += disbursement.quantity
            #         disbursement.delete()
            #     new_loan = models.Loan.objects.create(request=request, item=item, quantity_loaned=total_loaned, quantity_returned=total_returned)
            #     new_disb = models.Disbursement.objects.create(request=request, item=item, quantity=quantity, date=)
            #     new_loan.save()
            #     request.save()

        # Converting an item from non-asset-tracked to asset-tracked.
        # Create {item.quantity} Asset instances.
        # Do not modify existing loans/disbursements/backfills.
        # When we return a loan, we should make a new Asset.
        elif has_assets_old == False and has_assets_new == True:
                for i in range(item.quantity):
                    asset = models.Asset.objects.create(item=item)

        item.save()
        return item



class CartItemSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['item'] = ItemSerializer(context=self.context, read_only=True, many=False)

    quantity     = serializers.IntegerField(min_value=0, max_value=None, required=True)
    request_type = serializers.ChoiceField(choices=models.ITEM_REQUEST_TYPES, default=models.LOAN)

    class Meta:
        model = models.CartItem
        fields = ['item', 'quantity', 'request_type']

    def to_internal_value(self, data):
        item = data.get('item', None)
        owner = data.get('owner', None)
        data = super(CartItemSerializer, self).to_internal_value(data)
        data.update({"item": item, 'owner': owner})
        return data

    def validate(self, data):
        cart_quantity = data.get('quantity', None)
        item = data.get('item')
        try:
            cart_quantity = int(cart_quantity)
        except:
            raise ValidationError({"quantity": ["Quantity must be a positive integer."]})
        if (cart_quantity <= 0):
            raise ValidationError({"quantity": ["Quantity must be a positive integer."]})
        if (cart_quantity > item.quantity):
            raise ValidationError({"quantity": ["Cannot add more instances to your cart than are in stock ({}).".format(item.quantity)]})

        request_type = data.get('request_type', None)
        if (request_type != "disbursement") and (request_type != "loan"):
            raise ValidationError({"request_type": ["Request type must be one of 'disbursement', 'loan'."]})

        return data


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tag
        fields = ["id", 'name']

class TransactionSerializer(serializers.ModelSerializer):
    item          = serializers.SlugRelatedField(queryset=models.Item.objects.all(), slug_field="name")
    administrator = serializers.SlugRelatedField(queryset=User.objects.filter(is_staff=True), slug_field="username")
    assets        = serializers.SlugRelatedField(queryset=models.Asset.objects.filter(status=models.IN_STOCK), slug_field="tag", many=True, required=False)

    class Meta:
        model = models.Transaction
        fields = ["id", 'item', 'assets', 'category', 'quantity', 'date', 'comment', 'administrator']

    def validate(self, data):
        errors = {}

        quantity = data['quantity']
        try:
            quantity = int(quantity)
            if quantity <= 0:
                errors.update({"quantity": ["Quantity be a positive integer"]})
        except:
            errors.update({"quantity": ["Quantity be a positive integer"]})
        try:
            item = models.Item.objects.get(name=data['item'])
        except models.Item.DoesNotExist:
            errors.update({"item": ["Item with name '{}' does not exist.".format(data['item'])]})

        category = data.get('category', "")
        assets = data.get('assets', [])
        if category.lower() == "loss":
            if quantity > item.quantity:
                errors.update({"quantity": ["You may not remove more instances than are currently in stock."]})
            if item.has_assets:
                if (len(assets) != quantity):
                    errors.update({"assets": ["Expected {} assets tags, got {}.".format(quantity, len(assets))]})

        if errors:
            raise ValidationError(errors)
        return data

    def create(self, validated_data):
        transaction = super().create(validated_data)
        item = transaction.item

        if transaction.item.has_assets:
            if transaction.category == models.LOSS:
                for asset in transaction.assets.all():
                    asset.delete()

            elif transaction.category == models.ACQUISITION:
                for i in range(transaction.quantity):
                    asset = models.Asset.objects.create(item=transaction.item)
                    transaction.assets.add(asset)
        else:
            if transaction.category == models.LOSS:
                item.quantity -= validated_data["quantity"]
            elif transaction.category == models.ACQUISITION:
                item.quantity += validated_data["quantity"]

        item.save()
        transaction.save()
        return transaction



class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Profile
        fields = ['subscribed']

def validate_username(instance, value):
    netid_regex = re.compile(r'[a-z]{2,3}[0-9]{1,3}')
    if netid_regex.fullmatch(value):
        raise serializers.ValidationError("Username cannot be the same form as Duke NetID.")
    username_taken = (User.objects.filter(username=value).count() > 0)
    if username_taken:
        # POST REQUEST - We know instance is None
        if instance is None:
            raise ValidationError({"username": ["Username '{}' is already taken.".format(username)]})
        # PUT REQUEST - We must check and make sure that we're not changing our username to itself (ie. Brody -> Brody)
        else:
            if not (instance.username == value):
                raise ValidationError({"username": ["Username '{}' is already taken.".format(username)]})
    return value

class UserGETSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser', 'profile']

class UserPOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']

    def validate_username(self, value):
        return validate_username(self.instance, value)

    # add unique email when we add user signup back in
    '''
    def validate_email(self, value):
        email_taken = (User.objects.filter(email=email).count() > 0)

        if email_taken:
            raise serializers.ValidationError("Email is already taken.")
        return value
    '''

class UserPUTSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser', 'profile']

    def validate_username(self, value):
        if self.instance.username != value:
            # make sure you don't change username to a net id
            return validate_username(self.instance, value)
        else:
            return value

    def update(self, instance, validated_data):
        # Update the Profile
        profile_data = validated_data.pop('profile', None)
        for attr, value in profile_data.items():
            setattr(instance.profile, attr, value)

        # Update the User (could do super().update(instance, validated_data))
        instance = super(UserPUTSerializer, self).update(instance, validated_data)

        # Save the User (might not be necessary because it's called in super)
        # Profile gets saved automatically through post_save hook in models.py
        instance.save()

        return instance

class RequestedItemSerializer(serializers.ModelSerializer):
    item         = serializers.SlugRelatedField(read_only=False, queryset=models.Item.objects.all(), slug_field="name")
    quantity     = serializers.IntegerField(min_value=1, required=True)
    request_type = serializers.ChoiceField(choices=models.ITEM_REQUEST_TYPES)

    class Meta:
        model = models.RequestedItem
        fields = ['item', 'quantity', 'request_type']

class ApprovedItemSerializer(serializers.ModelSerializer):
    item         = serializers.SlugRelatedField(read_only=False, queryset=models.Item.objects.all(), slug_field="name")
    quantity     = serializers.IntegerField(min_value=1, required=True)
    request_type = serializers.ChoiceField(choices=models.ITEM_REQUEST_TYPES)
    assets       = serializers.SlugRelatedField(slug_field="tag", many=True, queryset=models.Asset.objects.all())

    class Meta:
        model = models.ApprovedItem
        fields = ['item', 'quantity', 'request_type', 'assets']

class BaseRequestSerializer(serializers.ModelSerializer):
    requester     = serializers.SlugRelatedField(slug_field="username", read_only=True)
    administrator = serializers.SlugRelatedField(slug_field="username", read_only=True)

    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'administrator', 'date_open', 'open_comment', 'date_closed', 'closed_comment', 'status']


class RequestSerializer(serializers.ModelSerializer):
    requester        = serializers.SlugRelatedField(read_only=True, slug_field="username")
    requested_items  = RequestedItemSerializer(read_only=True, many=True)
    date_open        = serializers.ReadOnlyField()
    open_comment     = serializers.CharField(default='', allow_blank=True)
    closed_comment   = serializers.ReadOnlyField()
    date_closed      = serializers.ReadOnlyField()
    administrator    = serializers.SlugRelatedField(read_only=True, slug_field="username")
    approved_items   = ApprovedItemSerializer(read_only=True, many=True)
    # loans            = serializers.SerializerMethodField(method_name="get_loan_representations")
    # disbursements    = serializers.SerializerMethodField(method_name="get_disbursement_representations")
    # backfill_requests = serializers.SerializerMethodField(method_name="get_backfill_request_representations")
    # backfills        = serializers.SerializerMethodField(method_name="get_backfill_representations")
    status           = serializers.ChoiceField(read_only=True, choices=models.STATUS_CHOICES)

    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'administrator', 'status', 'requested_items', 'approved_items', 'date_open', 'open_comment', 'date_closed',
                  'closed_comment']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.status == "A":
            data.pop('approved_items')
            data.pop('closed_comment')
            data.pop('date_closed')
            data.pop('administrator')
        return data

    # def get_loan_representations(self, request):
    #     loans = []
    #     for loan in request.loans.all():
    #         loan_json = LoanSerializerNoRequest(instance=loan, context=self.context).data
    #         loans.append(loan_json)
    #     return loans
    #
    # def get_disbursement_representations(self, request):
    #     disbursements = []
    #     for disbursement in request.disbursements.all():
    #         disbursement_json = DisbursementSerializerNoRequest(instance=disbursement, context=self.context).data
    #         disbursements.append(disbursement_json)
    #     return disbursements
    #
    # def get_backfill_representations(self, request):
    #     backfills = []
    #     for backfill in request.backfills.all():
    #         backfill_json = BackfillGETSerializer(instance=backfill, context=self.context).data
    #         backfills.append(backfill_json)
    #     return backfills
    #
    # def get_backfill_request_representations(self, request):
    #     backfill_requests_json = []
    #     for loan in request.loans.all():
    #         backfill_requests = loan.backfill_requests
    #         for backfill_request in backfill_requests.all():
    #             backfill_request_json = BackfillRequestGETSerializer(instance=backfill_request, context=self.context).data
    #             backfill_requests_json.append(backfill_request_json)
    #     return backfill_requests_json

    def to_internal_value(self, data):
        requester = data.get('requester', None)
        validated_data = super(RequestSerializer, self).to_internal_value(data)
        validated_data.update({"requester": requester})
        return validated_data

class RequestPUTSerializer(serializers.ModelSerializer):
    requester       = serializers.SlugRelatedField(read_only=True, slug_field="username")
    requested_items = RequestedItemSerializer(read_only=True, many=True)
    date_open       = serializers.DateTimeField(read_only=True)
    open_comment    = serializers.CharField(read_only=True)
    administrator   = serializers.SlugRelatedField(read_only=True, slug_field="username")
    date_closed     = serializers.DateTimeField(read_only=True)
    closed_comment  = serializers.CharField(allow_blank=True, default="")
    status          = serializers.ChoiceField(choices=((models.APPROVED, 'Approved'), (models.DENIED, 'Denied')))
    approved_items  = ApprovedItemSerializer(many=True)

    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'requested_items', 'approved_items',
                  'date_open', 'open_comment', 'date_closed', 'closed_comment',
                  'administrator', 'status']

    def to_internal_value(self, data):
        date_closed = timezone.now()
        administrator = data.get('administrator', None)
        validated_data = super(RequestPUTSerializer, self).to_internal_value(data)
        validated_data.update({"date_closed": date_closed, "administrator": administrator})
        return validated_data

    def validate(self, data):
        approved_items = data.get('approved_items', [])
        errors = {}
        approved_item_errors = {}
        for approved_item in approved_items:
            item = approved_item.get('item')
            item_errors = []
            if (item.has_assets):
                assets = approved_item.get('assets', [])
                quantity = approved_item.get('quantity', 0)

                asset_set = set(assets)
                if (len(assets) != quantity) or (len(asset_set) != len(assets)):
                    item_errors.append("Must specify {} unique asset tag(s).".format(quantity))
                else:
                    for asset in assets:
                        if asset.status != models.IN_STOCK:
                            item_errors.append("Asset with tag {} is not in stock.".format(asset.tag))
                        if asset.item.pk != item.pk:
                            item_errors.append("Asset with tag {} is not an instance of item {}.".format(asset.tag, item.name))

            if len(item_errors) > 0:
                errors.update({item.name: item_errors})

        if errors:
            raise ValidationError(errors)

        return super().validate(data)

    def update(self, instance, data):
        approved_items = data.pop('approved_items', [])

        if data.get('status', None) == "A":
            ai_instances = []
            for approved_item in approved_items:
                item = approved_item.get('item', None)
                quantity = approved_item.get('quantity', 0)
                request_type = approved_item.get('request_type', models.LOAN)
                assets = approved_item.get('assets', [])

                ai = models.ApprovedItem(request=instance, item=item, quantity=quantity, request_type=request_type)
                ai.save(assets=assets)

                ai_instances.append(ai)

        return super().update(instance, data)

class RequestLoanDisbursementSerializer(serializers.Serializer):
    def to_representation(self, request):
        request_json = RequestSerializer(context=self.context, instance=request).data
        loans = LoanSerializerNoRequest(instance=request.loans.all(), many=True).data
        disbursements = DisbursementSerializerNoRequest(instance=request.disbursements.all(), many=True).data
        backfill_requests = BackfillRequestGETSerializer(instance=request.backfill_requests.all(), many=True).data
        backfills = BackfillGETSerializer(instance=request.backfills.all(), many=True).data
        d = {
            "disbursements": disbursements,
            "loans": loans,
            "backfills": backfills,
            "backfill_requests": backfill_requests,
            "request": request_json
        }
        return d

class LoanSerializer(serializers.ModelSerializer):
    item    = serializers.SlugRelatedField(slug_field="name", read_only=True)
    request = BaseRequestSerializer(read_only=True)

    class Meta:
        model = models.Loan
        fields = ['id', 'request', 'item', 'quantity_loaned', 'quantity_returned', 'date_loaned', 'date_returned']
        read_only_fields = ['id', 'item', 'quantity_loaned', 'date_loaned']

    def to_representation(self, loan):
        loan_json = super().to_representation(loan)
        if loan.asset != None:
            loan_json.update({"asset": loan.asset.tag})

        outstanding_backfill_request = None
        for backfill_request in loan.backfill_requests.all():
            if backfill_request.status == models.OUTSTANDING:
                outstanding_backfill_request = BackfillRequestGETSerializerNoLoan(instance=backfill_request).data
        loan_json.update({"outstanding_backfill_request": outstanding_backfill_request})
        return loan_json

    def update(self, instance, validated_data):
        old_quantity = instance.quantity_returned
        loan = super(LoanSerializer, self).update(instance, validated_data)
        new_quantity = loan.quantity_returned

        loan.item.quantity += (new_quantity - old_quantity)
        loan.item.save()

        # Loan was fully returned.
        if loan.quantity_returned == loan.quantity_loaned:
            # delete any outstanding backfill requests
            for bf in loan.backfill_requests.all():
                if bf.status == models.OUTSTANDING:
                    bf.delete()

            if (loan.asset):
                loan.asset.status = models.IN_STOCK
                loan.asset.save()
            # This loan was created, then the item became non-asset-tracked, then
            # the item was switched back to asset tracked. As a result, we stopped tracking
            # this specific asset, and we will need to create a new one when it is returned to the
            # inventory.
            elif (loan.item.has_assets and loan.asset == None):
                # we returned a single instance. simply add a new asset to this loan.
                if (loan.quantity_returned == 1):
                    asset = models.Asset.objects.create(item=loan.item)
                    loan.asset = asset
                    loan.save()
                # we returned several untracked instances. delete this loan object, and instead
                # create one new loan object for each instance we are returning.
                else:
                    for i in range(new_quantity - old_quantity):
                        asset = models.Asset.objects.create(item=loan.item)
                        new_loan = models.Loan.objects.create(request=loan.request, item=loan.item, asset=asset, quantity_loaned=1, quantity_returned=1)
                        loan.quantity_returned -= 1
                        loan.quantity_loaned -= 1
                    loan.save()

        # Loan was partially returned.
        else:
            if (loan.item.has_assets and loan.asset == None):
                for i in range(new_quantity - old_quantity):
                    asset = models.Asset.objects.create(item=loan.item)
                    new_loan = models.Loan.objects.create(request=loan.request, item=loan.item, asset=asset, quantity_loaned=1, quantity_returned=1)
                    loan.quantity_loaned -= 1
                    loan.quantity_returned -= 1
                loan.save()

        return loan

class LoanSerializerNoBackfillRequest(serializers.ModelSerializer):
    item = serializers.SlugRelatedField(slug_field="name", read_only=True)

    class Meta:
        model = models.Loan
        fields = ['id', 'item', 'quantity_loaned', 'quantity_returned', 'date_loaned', 'date_returned']
        read_only_fields = ['id', 'item', 'quantity_loaned', 'date_loaned']

    def to_representation(self, loan):
        loan_json = super().to_representation(loan)
        if loan.asset != None:
            loan_json.update({"asset": loan.asset.tag})
        return loan_json

class LoanSerializerNoRequest(serializers.ModelSerializer):
    item    = serializers.SlugRelatedField(slug_field="name", read_only=True)

    class Meta:
        model = models.Loan
        fields = ['id', 'item', 'quantity_loaned', 'quantity_returned', 'date_loaned', 'date_returned']
        read_only_fields = ['id', 'item', 'quantity_loaned', 'date_loaned']

    def to_representation(self, loan):
        loan_json = super().to_representation(loan)
        if loan.asset != None:
            loan_json.update({"asset": loan.asset.tag})

        outstanding_backfill_request = None
        for backfill_request in loan.backfill_requests.all():
            if backfill_request.status == models.OUTSTANDING:
                outstanding_backfill_request = BackfillRequestGETSerializerNoLoan(instance=backfill_request).data
        loan_json.update({"outstanding_backfill_request": outstanding_backfill_request})
        return loan_json

class DisbursementSerializer(serializers.ModelSerializer):
    item    = serializers.SlugRelatedField(slug_field="name", read_only=True)
    request = BaseRequestSerializer(read_only=True)

    class Meta:
        model = models.Disbursement
        fields = ['id', 'request', 'item', 'quantity', 'date']
        read_only_fields = ['id', 'item', 'quantity_loaned', 'date']

    def to_representation(self, disbursement):
        disbursement_json = super().to_representation(disbursement)
        if disbursement.asset != None:
            disbursement_json.update({"asset": disbursement.asset.tag})
        return disbursement_json

class DisbursementSerializerNoRequest(serializers.ModelSerializer):
    item    = serializers.SlugRelatedField(slug_field="name", read_only=True)

    class Meta:
        model = models.Disbursement
        fields = ['id', 'item', 'quantity', 'date']
        read_only_fields = ['id', 'item', 'quantity_loaned', 'date']

    def to_representation(self, disbursement):
        disbursement_json = super().to_representation(disbursement)
        if disbursement.asset != None:
            disbursement_json.update({"asset": disbursement.asset.tag})
        return disbursement_json

class ConversionSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(required=True)

    def to_internal_value(self, data):
        quantity = data.get('quantity', None)
        loan = data.get('loan', None)
        try:
            quantity = int(quantity)
        except:
            raise serializers.ValidationError({"quantity": ["Quantity must be a positive integer."]})
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": ["Quantity must be a positive integer."]})
        if quantity > loan.quantity_loaned - loan.quantity_returned:
            raise serializers.ValidationError({"quantity": ["Quantity must not be greater than the number of outstanding instances in this loan ({})".format(loan.quantity_loaned - loan.quantity_returned)]})

        return {"quantity": quantity, "loan": loan}


class LoanReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.LoanReminder
        fields = ['id', 'body', 'subject', 'date']

    def to_internal_value(self, data):
        validated_data = data.copy()
        today = datetime.now().date()
        errors = {}
        if data["date"]==None:
            errors["date"] = ["Date cannot be empty"]
        else:
            try:
                validated_data["date"] = dateutil.parser.parse(data["date"]).date()
                if validated_data["date"] < today:
                    errors["date"] = ["Date cannot be in the past."]
            except:
                errors["date"] = ["Invalid date."]


        if errors:
            raise ValidationError(errors)
        return validated_data


class SubjectTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.SubjectTag
        fields = ['text']

class LogSerializer(serializers.ModelSerializer):
    item            = serializers.SlugRelatedField(slug_field="name",     read_only=True)
    initiating_user = serializers.SlugRelatedField(slug_field="username", read_only=True)
    affected_user   = serializers.SlugRelatedField(slug_field="username", read_only=True)

    class Meta:
        model = models.Log
        fields = ['id', "item", "request", "quantity", "date_created", "initiating_user", 'message', 'affected_user', "category", "default_item", "default_affected_user", "default_initiating_user"]

class BulkImportSerializer(serializers.ModelSerializer):
    administrator = serializers.SlugRelatedField(
        slug_field='username',
        queryset=models.User.objects.filter(is_superuser=True),
    )
    data = serializers.FileField()

    class Meta:
        model = models.BulkImport
        fields = ['id', 'data', 'administrator']

class BackfillGETSerializer(serializers.ModelSerializer):
    receipt = serializers.FileField()
    item = serializers.SlugRelatedField(slug_field="name", read_only=True)
    asset = serializers.SlugRelatedField(slug_field="tag", read_only=True)

    class Meta:
        model = models.Backfill
        fields = ['id', 'request', 'item', 'asset', 'quantity', 'date_created', 'date_satisfied', 'status', 'requester_comment', 'receipt', 'admin_comment']

class BackfillPUTSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=models.BACKFILL_STATUS_CHOICES)

    class Meta:
        model = models.Backfill
        fields = ['status']

    def to_internal_value(self, data):
        date_satisfied = timezone.now()
        validated_data = super(BackfillPUTSerializer, self).to_internal_value(data)
        validated_data.update({"date_satisfied": date_satisfied})
        return validated_data

    def update(self, backfill, data):
        #todo are this supposed to update the inventory like this??
        
        status = data.get('status')
        if status == models.SATISFIED:
            item = backfill.item
            if item.has_assets:
                for i in range(backfill.quantity):
                    asset = models.Asset.objects.create(item=item)
                item.quantity += backfill.quantity
                item.save()
            else:
                item.quantity += backfill.quantity
                item.save()
        
        super().update(backfill, data)     
        return backfill



class BackfillRequestGETSerializer(serializers.ModelSerializer):
    receipt = serializers.FileField()
    loan = LoanSerializerNoBackfillRequest()
    item = serializers.SlugRelatedField(slug_field="name", read_only=True)
    asset = serializers.SlugRelatedField(slug_field="tag", read_only=True)


    class Meta:
        model = models.BackfillRequest
        fields = ['id', 'request', 'item', 'asset', 'quantity', 'requester_comment', 'loan', 'receipt', 'status', 'admin_comment']

    def to_representation(self, backfill_request):
        backfill_request_json = super().to_representation(backfill_request)
        owner_username = backfill_request.request.requester.username
        backfill_request_json.update({"owner_username":owner_username})
        return backfill_request_json

class BackfillRequestGETSerializerNoLoan(serializers.ModelSerializer):
    receipt = serializers.FileField()

    class Meta:
        model = models.BackfillRequest
        fields = ['id', 'quantity', 'requester_comment', 'receipt', 'status', 'admin_comment']

    def to_representation(self, backfill_request):
        backfill_request_json = super().to_representation(backfill_request)
        owner_username = backfill_request.request.requester.username
        backfill_request_json.update({"owner_username":owner_username})
        return backfill_request_json

class BackfillRequestPOSTSerializer(serializers.ModelSerializer):
    receipt = serializers.FileField()
    #loan = # todo change loan serializer to something other than id?
    # quantity = serializers.IntegerField(min_value=1)
    class Meta:
        model = models.BackfillRequest
        fields = ['requester_comment', 'receipt']

    def to_internal_value(self, data):
        loan = data.get('loan', None)
        request = loan.request
        data = super().to_internal_value(data)
        data.update({"loan": loan})
        data.update({"request": request})
        return data

    def validate(self, data):
        receipt = data.get('receipt')
        validate_file_extension(receipt)
        return data

    def create(self, validated_data):
        loan = validated_data.get('loan')
        q = loan.quantity_loaned - loan.quantity_returned
        backfill_request = models.BackfillRequest.objects.create(request=loan.request, loan=loan, item=loan.item,
                                                                 asset=loan.asset, quantity=q,
                                                                 requester_comment=validated_data.get('requester_comment'),
                                                                 receipt=validated_data.get('receipt'))
        return backfill_request


class BackfillRequestPUTSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=models.BACKFILL_REQUEST_STATUS_CHOICES)
    class Meta:
        model = models.BackfillRequest
        fields = ['status', 'admin_comment']

    # uncomment and fix to deal with permissioning on a field-level basis in serializer
    '''
    def to_internal_value(self, data):
        user = data.pop("user", None)
        data = super(BackfillRequestPUTSerializer, self).to_internal_value(data)
        data.update({"user": user})
        print("user", user)


        return data

    def update(self, backfill_request, validated_data):
        user = validated_data.pop("user", None)

        print("user", user)
        print("userpk", user.pk)
        print("requester pk", backfill_request.loan.request.requester.pk)
        is_owner = (backfill_request.loan.request.requester.pk == user.pk)
        is_manager = (user.is_superuser or user.is_staff)
        print("owner?", is_owner)
        print("manager", is_manager)

        if is_owner and not is_manager:
            for key in validated_data.keys():
                if key not in set({"receipt"}):
                    raise ValidationError({key: ["Need manager privileges to edit field with name \'{}\'.".format(key)]})

        elif is_manager and not is_owner:
            for key in validated_data.keys():
                if key not in set({"status", "admin_comment"}):
                    raise ValidationError({key: ["Need owner privileges to edit field with name \'{}\'.".format(key)]})

        backfill_request = super(BackfillRequestPUTSerializer, self).update(backfill_request, validated_data)
        return backfill_request
    '''
