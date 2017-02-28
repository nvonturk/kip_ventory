from rest_framework import serializers, pagination
from rest_framework.exceptions import ValidationError
from . import models
from django.contrib.auth.models import User
from django.utils import timezone
import re

class CustomFieldSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=True)
    private = serializers.BooleanField(default=False)
    field_type = serializers.ChoiceField(choices=models.FIELD_TYPES)

    class Meta:
        model = models.CustomField
        fields = ('name', 'private', 'field_type',)

class CustomValueSerializer(serializers.ModelSerializer):
    field = serializers.SlugRelatedField(read_only=True, slug_field="name")
    value = serializers.CharField(max_length=None, min_length=None, required=True, source='*', allow_blank=True)

    class Meta:
        model = models.CustomValue
        fields = ('field', 'value',)

    def to_representation(self, cv):
        user = self.context['request'].user
        d = {'name': cv.field.name, 'value': cv.get_value(), 'field_type': cv.field.field_type}
        if (user.is_staff or user.is_superuser):
            d.update({'private': cv.field.private})
        return d

    def to_internal_value(self, data):
        validated_data = {}
        errors = {}
        # get value type specified in CustomField
        name = data.get('name')
        ft = models.CustomField.objects.get(name=name).field_type
        # convert value to correct type
        try:
            value = data.get('value')
            validated_data['value'] = models.FIELD_TYPE_DICT[ft](value)
        except:
            errors.update({'value': 'Expected \'{}\' type, got \'{}\'.'.format(models.FIELD_TYPE_DICT[ft].__name__, type(value).__name__)})

        if errors:
            raise ValidationError(errors)

        return validated_data

    def update(self, instance, validated_data):
        ft = instance.field.field_type
        setattr(instance, ft, validated_data.get('value', getattr(instance, ft)))
        instance.save()
        return instance

class ItemSerializer(serializers.ModelSerializer):
    name          = serializers.CharField(max_length=None, min_length=None, required=True)
    quantity      = serializers.IntegerField(min_value=0, max_value=None, required=True)
    model_no      = serializers.CharField(max_length=None, min_length=None, allow_blank=True, required=False)
    description   = serializers.CharField(max_length=None, min_length=None, allow_blank=True, required=False)
    tags          = serializers.SlugRelatedField(slug_field="name", read_only=False, many=True, queryset=models.Tag.objects.all(), required=False)
    custom_fields = serializers.SerializerMethodField(method_name="get_custom_fields_by_permission")
    in_cart       = serializers.SerializerMethodField(method_name="is_item_in_cart")

    class Meta:
        model  = models.Item
        fields = ['name', 'quantity', 'model_no', 'description', 'tags', 'custom_fields', 'in_cart']

    def get_custom_fields_by_permission(self, item):
        user = self.context['request'].user
        if user.is_staff:
            return [{"name": cv.field.name, "value": cv.get_value(), "field_type": cv.field.field_type, "private": cv.field.private} for cv in item.values.all()]
        else:
            return [{"name": cv.field.name, "value": cv.get_value(), "field_type": cv.field.field_type} for cv in item.values.all().filter(field__private=False)]

    def is_item_in_cart(self, item):
        user = self.context['request'].user
        is_in_cart = (models.CartItem.objects.filter(owner__pk=user.pk, item__name=item.name).count() > 0)
        return is_in_cart

    def to_internal_value(self, data):
        errors = {}
        # check standard field names as defined in the serializer
        print(data)
        item_data = super(ItemSerializer, self).to_internal_value(data)
        print(item_data)
        # check for valid CustomField names in this data.
        field_data = {}
        fields = models.CustomField.objects.all()
        for field_name, value in data.items():
            cf_exists = (fields.filter(name=field_name).count() > 0)
            if cf_exists:
                cf = fields.get(name=field_name)
                try:
                    val = models.FIELD_TYPE_DICT[cf.field_type](value)
                    field_data.update({cf: val})
                except:
                    errors.update({field_name: 'Expected \'{}\' type, got \'{}\'.'.format(models.FIELD_TYPE_DICT[ft].__name__, type(value).__name__)})
        if errors:
            raise ValidationError(errors)
        validated_data = {"field_data": field_data, "item_data": item_data}
        return validated_data

    def create(self, validated_data):
        item_data  = validated_data['item_data']
        field_data = validated_data['field_data']
        # create the item from the intrinsic data fields
        print(item_data)
        item = super(ItemSerializer, self).create(item_data)
        print(item_data)
        # there will be a complete set of blank CustomValues associated with this Item
        # as a result of the Item.save() method.
        item_values = item.values.all()
        # If we have
        for field, value in field_data.items():
            try:
                cv = item_values.get(field__pk=field.pk)
                setattr(cv, field.field_type, value)
                cv.save()
            except:
                print("baseee")
        return item

    def update(self, instance, validated_data):
        item_data = validated_data['item_data']
        field_data = validated_data['field_data']
        print(item_data)
        instance = super(ItemSerializer, self).update(instance, item_data)
        instance.save()
        return instance

class CartItemSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super(CartItemSerializer, self).__init__(*args, **kwargs)
        self.fields['item'].context = self.context

    item      = ItemSerializer(read_only=True, many=False)
    quantity  = serializers.IntegerField(required=True)

    class Meta:
        model = models.CartItem
        fields = ['item', 'quantity', 'id']

    def to_internal_value(self, data):
        quantity = data.get('quantity', None)
        owner = data.get('owner', None)
        item = data.get('item', None)

        errors = {}
        try:
            quantity = int(quantity)
        except:
            errors.update({'quantity': 'Quantity must be an integer.'})
        if not isinstance(owner, User):
            errors.update({'owner': "Owner must be an instance of 'User' model."})
        if not isinstance(item, models.Item):
            errors.update({'item': "Item must be an instance of 'Item' model."})
        if errors:
            raise ValidationError(errors)

        return {
            'item': item,
            'owner': owner,
            'quantity': quantity
        }

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.save()
        return instance


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

class UserGETSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']

def validate_username(value):
    reg = re.compile('[a-z]{2,3}[0-9]{1,3}')
    print(reg.match(value))
    print(reg.fullmatch(value))
    if reg.fullmatch(value):
        raise serializers.ValidationError("Username cannot be a net id.")
    username_taken = (User.objects.filter(username=value).count() > 0)
    if username_taken:
        raise serializers.ValidationError("Username is already taken.")
    return value

class UserPOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email']

    def validate_username(self, value):
        return validate_username(value)

    # add unique email when we add user signup back in
    '''
    def validate_email(self, value):
        email_taken = (User.objects.filter(email=email).count() > 0)
         
        if email_taken:
            raise serializers.ValidationError("Email is already taken.")
        return value
    '''

class UserPUTSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']

    def validate_username(self, value):
        #todo make sure you can't change username to somebody else's. 
        #return validate_username(value)
        return value

class RequestItemSerializer(serializers.ModelSerializer):
    item     = serializers.SlugRelatedField(read_only=True, slug_field="name")
    quantity = serializers.IntegerField(required=True)

    class Meta:
        model = models.RequestItem
        fields = ['item', 'quantity']


class RequestSerializer(serializers.ModelSerializer):
    request_id     = serializers.ReadOnlyField(source='id')
    requester      = serializers.SlugRelatedField(read_only=True, slug_field="username")
    request_items  = RequestItemSerializer(read_only=True, many=True)
    date_open      = serializers.ReadOnlyField()
    open_comment   = serializers.CharField(max_length=500, default='', allow_blank=True)

    date_closed    = serializers.ReadOnlyField()
    closed_comment = serializers.ReadOnlyField()
    administrator  = serializers.SlugRelatedField(read_only=True, slug_field="username")
    status         = serializers.ChoiceField(read_only=True, choices=models.STATUS_CHOICES)

    class Meta:
        model = models.Request
        fields = ['request_id', 'requester', 'request_items', 'date_open', 'open_comment', 'date_closed', 'closed_comment', 'administrator', 'status']

    def to_internal_value(self, data):
        validated_data = {}
        errors = {}

        requester = data.get('requester', None)
        open_comment = data.get('open_comment', None)

        return {
            'requester': requester,
            'open_comment': open_comment
        }

class RequestPUTSerializer(serializers.ModelSerializer):
    request_id    = serializers.ReadOnlyField(source='id')
    requester     = serializers.SlugRelatedField(read_only=True, slug_field="username")
    request_items = RequestItemSerializer(read_only=True, many=True)
    date_open     = serializers.DateTimeField(read_only=True)
    open_comment  = serializers.CharField(read_only=True)

    administrator  = serializers.SlugRelatedField(read_only=True, slug_field="username")
    date_closed    = serializers.DateTimeField(read_only=True)
    closed_comment = serializers.CharField(max_length=500, allow_blank=True, default="")
    status         = serializers.ChoiceField(choices=((models.APPROVED, 'Approved'), (models.DENIED, 'Denied')))

    class Meta:
        model = models.Request
        fields = ['request_id', 'requester', 'request_items', 'date_open', 'open_comment', 'date_closed', 'closed_comment', 'administrator', 'status']

    def to_internal_value(self, data):
        validated_data = {}
        errors = {}

        date_closed = timezone.now()
        closed_comment = data.get('closed_comment', None)
        administrator = data.get('administrator', None)
        status = data.get('status', None)

        return {
            "date_closed": date_closed,
            "closed_comment": closed_comment,
            "administrator": administrator,
            "status": status
        }

class LogSerializer(serializers.ModelSerializer):
    item            = serializers.SlugRelatedField(slug_field="name",     read_only=True)
    initiating_user = serializers.SlugRelatedField(slug_field="username", read_only=True)
    affected_user   = serializers.SlugRelatedField(slug_field="username", read_only=True)

    class Meta:
        model = models.Log
        fields = ['id', "item", "quantity", "date_created", "initiating_user", 'message', 'affected_user', "category", "default_item", "default_affected_user", "default_initiating_user"]
