from rest_framework import serializers
from . import models, serializers
from rest_framework import serializers as rest_serializers
import six

class Item_Field(rest_serializers.IntegerField):
    default_error_messages = {
        'incorrect_type': 'Incorrect type. Expected a number, but got {input_type}',
        'invalid_item': 'There is no item with that primary key.'
    }

    def to_representation(self, item):
        return serializers.ItemSerializer(item, context=self.context).data

    def to_internal_value(self, data):
        # coerce to integer
        data = super(Item_Field, self).to_internal_value(data)
        if not isinstance(data, six.integer_types):
            self.fail('incorrect_type', input_type=type(data).__name__)
        try:
            item = models.Item.objects.get(pk=data)
        except:
            self.fail('invalid_item')
        return item
