from rest_framework import serializers, pagination
from . import models, fields
from django.contrib.auth.models import User
import collections, json



class CustomFieldSerializer(serializers.ModelSerializer):
    id         = serializers.ReadOnlyField()
    item       = serializers.HiddenField(default=None)
    field_type = serializers.ChoiceField(choices=models.field_types)

    class Meta:
        model  = models.CustomField
        fields = ['id', 'item', 'name', 'value', 'private', 'field_type']

    def update(self, instance, validated_data):
        instance.name       = validated_data.get('name', instance.name)
        instance.value      = validated_data.get('value', instance.value)
        instance.private    = validated_data.get('private', instance.private)
        instance.field_type = validated_data.get('field_type', instance.field_type)
        instance.save()
        return instance


class ItemSerializer(serializers.ModelSerializer):
    id            = serializers.ReadOnlyField()
    name          = serializers.CharField(max_length=None, min_length=None, required=True)
    quantity      = serializers.IntegerField(min_value=0, max_value=None, required=True)
    model_no      = serializers.CharField(max_length=None, min_length=None, allow_blank=True, required=False)
    description   = serializers.CharField(max_length=None, min_length=None, allow_blank=True, required=False)
    tags          = serializers.StringRelatedField(many=True, required=False)
    custom_fields = serializers.SerializerMethodField(method_name="get_custom_fields_by_permission")

    class Meta:
        model  = models.Item
        fields = ['id', 'name', 'quantity', 'model_no', 'description', 'tags', 'custom_fields']

    def get_custom_fields_by_permission(self, item):
        user = self.context['request'].user
        custom_fields = item.custom_fields.all()
        if user.is_staff:
            serializer = CustomFieldSerializer(custom_fields, many=True)
            return serializer.data
        else:
            custom_fields = custom_fields.filter(private=False)
            serializer = CustomFieldSerializer(custom_fields, many=True)
            return serializer.data

    def update(self, instance, validated_data):
        # update all Item fields if new data is present
        instance.name = validated_data.get('name', instance.name)
        instance.model_no = validated_data.get('model_no', instance.model_no)
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance


class CartItemSerializer(serializers.ModelSerializer):
    id        = serializers.ReadOnlyField()
    item      = fields.Item_Field(required=True)
    quantity  = serializers.IntegerField(required=True)

    class Meta:
        model = models.CartItem
        fields = ['id', 'item', 'quantity']

    def update(self, instance, validated_data):
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.save()
        return instance
