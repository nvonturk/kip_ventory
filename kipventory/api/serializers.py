from rest_framework import serializers, pagination
from rest_framework.exceptions import ValidationError
from . import models
from django.contrib.auth.models import User

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
        d = {'name': cv.field.name, 'value': cv.get_value()}
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
    # id            = serializers.ReadOnlyField()
    name          = serializers.CharField(max_length=None, min_length=None, required=True)
    quantity      = serializers.IntegerField(min_value=0, max_value=None, required=True)
    model_no      = serializers.CharField(max_length=None, min_length=None, allow_blank=True, required=False)
    description   = serializers.CharField(max_length=None, min_length=None, allow_blank=True, required=False)
    tags          = serializers.StringRelatedField(many=True, required=False)
    custom_fields = serializers.SerializerMethodField(method_name="get_custom_fields_by_permission")

    class Meta:
        model  = models.Item
        fields = ['name', 'quantity', 'model_no', 'description', 'tags', 'custom_fields']

    def get_custom_fields_by_permission(self, item):
        user = self.context['request'].user
        if user.is_staff:
            return [{"name": cv.field.name, "value": cv.get_value(), "private": cv.field.private} for cv in item.values.all()]
        else:
            return [{"name": cv.field.name, "value": cv.get_value()} for cv in item.values.all().filter(field__private=False)]



class CartItemSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super(CartItemSerializer, self).__init__(*args, **kwargs)
        self.fields['item'].context = self.context

    item      = ItemSerializer(read_only=True, many=False)
    quantity  = serializers.IntegerField(required=True)

    class Meta:
        model = models.CartItem
        fields = ['item', 'quantity']

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
            errors.update({'owner': "Owner must be an instance of 'KipventoryUser' model."})
        if not isinstance(item, models.Item):
            errors.update({'item': "item must be an instance of 'Item' model."})
        if errors:
            raise ValidationError(errors)

        return {
            'item': data.get('item'),
            'owner': data.get('owner'),
            'quantity': quantity
        }

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.save()
        return instance
