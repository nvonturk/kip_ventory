from rest_framework import serializers
from . import models


class ItemSerializer(serializers.ModelSerializer):
     class Meta:
        model = models.Item
        fields = ('id', 'name', 'category')

class CategorySerializer(serializers.ModelSerializer):
    name = serializers.StringRelatedField(many=True)
    class Meta:
        model = models.Category
        fields = ('name')
