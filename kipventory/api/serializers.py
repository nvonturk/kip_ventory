from rest_framework import serializers, pagination
from rest_framework.exceptions import ValidationError
from . import models
from django.contrib.auth.models import User
from django.utils import timezone
import dateutil.parser
from datetime import datetime
from django.db.models import Q, F

import re, json

from rest_framework.utils.serializer_helpers import BindingDict


class CustomFieldSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=128, required=True)
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

        self.fields['tag'] = serializers.CharField(max_length=256, required=False)

        for custom_field in custom_fields:
            ft = custom_field.field_type
            if ft == "Single":
                self.fields[custom_field.name] = serializers.CharField(max_length=256,  required=False, allow_blank=True, default="")
            elif ft == "Multi":
                self.fields[custom_field.name] = serializers.CharField(max_length=8192, required=False, allow_blank=True, default="")
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
                                             instance=asset.loans.filter(quantity_loaned__gt=F('quantity_returned')).get(asset=asset.tag)).data})

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
                self.fields[custom_field.name] = serializers.CharField(max_length=256,  required=False, allow_blank=True, default="")
            elif ft == "Multi":
                self.fields[custom_field.name] = serializers.CharField(max_length=8192, required=False, allow_blank=True, default="")
            elif ft == "Int":
                self.fields[custom_field.name] = serializers.IntegerField(required=False, default=0)
            elif ft == "Float":
                self.fields[custom_field.name] = serializers.FloatField(required=False, default=0.0)

    name          = serializers.CharField(max_length=256,  required=True,  allow_blank=False)
    quantity      = serializers.IntegerField(min_value=0,  required=True)
    model_no      = serializers.CharField(max_length=256,  required=False, allow_blank=True, default="")
    description   = serializers.CharField(max_length=1024, required=False, allow_blank=True, default="")
    tags          = serializers.ListField(child=serializers.CharField(max_length=128, allow_blank=True), required=False, default=None)
    has_assets    = serializers.BooleanField(required=False, default=False)
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

    class Meta:
        model = models.Transaction
        fields = ["id", 'item', 'category', 'quantity', 'date', 'comment', 'administrator']

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
        if category.lower() == "loss":
            if quantity > item.quantity:
                errors.update({"quantity": ["You may not remove more instances than are currently in stock."]})

        if errors:
            raise ValidationError(errors)

        return data

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
    open_comment     = serializers.CharField(max_length=1024, default='', allow_blank=True)
    closed_comment   = serializers.ReadOnlyField()
    date_closed      = serializers.ReadOnlyField()
    administrator    = serializers.SlugRelatedField(read_only=True, slug_field="username")
    approved_items   = ApprovedItemSerializer(read_only=True, many=True)
    loans            = serializers.SerializerMethodField(method_name="get_loan_representations")
    disbursements    = serializers.SerializerMethodField(method_name="get_disbursement_representations")
    backfill_requests = serializers.SerializerMethodField(method_name="get_backfill_request_representations")
    backfills        = serializers.SerializerMethodField(method_name="get_backfill_representations")

    status           = serializers.ChoiceField(read_only=True, choices=models.STATUS_CHOICES)

    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'administrator', 'status', 'requested_items', 'approved_items', 'date_open', 'open_comment', 'date_closed',
                  'closed_comment', 'loans', 'disbursements', 'backfill_requests', 'backfills']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.status == "A":
            data.pop('approved_items')
            data.pop('closed_comment')
            data.pop('date_closed')
            data.pop('loans')
            data.pop('disbursements')
            data.pop('administrator')
        return data

    def get_loan_representations(self, request):
        loans = []
        for loan in request.loans.all():
            loan_json = LoanSerializerNoRequest(instance=loan, context=self.context).data
            loans.append(loan_json)
        return loans

    def get_disbursement_representations(self, request):
        disbursements = []
        for disbursement in request.disbursements.all():
            disbursement_json = DisbursementSerializerNoRequest(instance=disbursement, context=self.context).data
            disbursements.append(disbursement_json)
        return disbursements

    def get_backfill_representations(self, request):
        backfills = []
        for backfill in request.backfills.all():
            backfill_json = BackfillGETSerializer(instance=backfill, context=self.context).data
            backfills.append(backfill_json)
        return backfills

    def get_backfill_request_representations(self, request):
        backfill_requests_json = []
        for loan in request.loans.all():
            backfill_requests = loan.backfill_requests
            for backfill_request in backfill_requests.all():
                backfill_request_json = BackfillRequestGETSerializer(instance=backfill_request, context=self.context).data
                backfill_requests_json.append(backfill_request_json)
        return backfill_requests_json

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
    closed_comment  = serializers.CharField(max_length=1024, allow_blank=True, default="")
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
        for approved_item in approved_items:
            item = approved_item.get('item')
            if (item.has_assets):
                assets = approved_item.get('assets', [])
                quantity = approved_item.get('quantity', 0)

                if (len(assets) != quantity):
                    raise ValidationError({"approved_items": ["Must specify {} unique asset tag(s).".format(quantity)]})

                asset_set = set(assets)
                if len(asset_set) != len(assets):
                    raise ValidationError({"approved_items": ["Must specify {} unique asset tag(s).".format(quantity)]})

                for asset in assets:
                    if asset.status != models.IN_STOCK:
                        raise ValidationError({"approved_items": ["Asset with tag {} is not in stock.".format(asset.tag)]})
                    if asset.item.pk != item.pk:
                        raise ValidationError({"approved_items": ["Asset with tag {} is not an instance of item {}.".format(asset.tag, item.name)]})

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
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['loans'] = LoanSerializerNoRequest(context=self.context, many=True, read_only=True)
        self.fields['disbursements'] = DisbursementSerializerNoRequest(context=self.context, many=True, read_only=True)

    def to_representation(self, request):
        request_json = RequestSerializer(context=self.context, instance=request).data
        loans = request_json.pop('loans')
        disbursements = request_json.pop('disbursements')
        d = {
            "disbursements": disbursements,
            "loans": loans,
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
        return loan_json

    def update(self, instance, validated_data):
        old_quantity = instance.quantity_returned
        loan = super(LoanSerializer, self).update(instance, validated_data)
        new_quantity = instance.quantity_returned
        loan.item.quantity += (new_quantity - old_quantity)
        loan.item.save()
        if loan.quantity_returned == loan.quantity_loaned:
            if (loan.asset):
                loan.asset.status = models.IN_STOCK
                loan.asset.save()
        return loan


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
    #loan = # todo change loan serializer to something other than id?
    class Meta: 
        model = models.Backfill
        fields = ['id', 'request', 'date_created', 'date_satisfied', 'status', 'requester_comment', 'receipt', 'admin_comment']

class BackfillRequestGETSerializer(serializers.ModelSerializer):
    receipt = serializers.FileField()
    #loan = # todo change loan serializer to something other than id?
    class Meta: 
        model = models.BackfillRequest
        fields = ['id', 'requester_comment', 'loan', 'receipt', 'status', 'admin_comment']

class BackfillRequestPOSTSerializer(serializers.ModelSerializer):
    receipt = serializers.FileField()
    #loan = # todo change loan serializer to something other than id?
   
    class Meta:
        model = models.BackfillRequest
        fields = ['requester_comment', 'loan', 'receipt', 'status', 'admin_comment']

class BackfillRequestPUTSerializer(serializers.ModelSerializer):
    receipt = serializers.FileField()

    class Meta:
        model = models.BackfillRequest
        fields = ['id', 'receipt', 'status', 'admin_comment']

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

