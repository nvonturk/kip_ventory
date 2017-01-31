from rest_framework import serializers
from . import models
from django.contrib.auth.models import User


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tag
        fields = ['name']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'is_staff']



class ItemSerializer(serializers.ModelSerializer):
    tags = TagSerializer(read_only=True, many=True)
    class Meta:
        model = models.Item
        fields = ['name', 'location', 'model', 'quantity', 'description', 'tags']



class CartItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=False, many=False)
    owner = UserSerializer(read_only=False, many=False)

    class Meta:
        model = models.CartItem
        fields = ['item', 'owner', 'quantity']



class RequestSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True, many=False)
    item      = ItemSerializer(read_only=True, many=False)

    class Meta:
        model = models.Request
        fields = ['requester', 'item', 'quantity']
