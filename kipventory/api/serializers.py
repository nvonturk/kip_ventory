from rest_framework import serializers
from . import models
from django.contrib.auth.models import User

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Tag
        fields = ["id", 'name']

class UserGETSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff']

class UserPOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'first_name', 'last_name', 'email']

class ItemRequestGETSerializer(serializers.ModelSerializer):
    requester = UserGETSerializer(read_only=True, many=False)
    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'quantity', 'date_open', 'open_reason']

class ItemGETSerializer(serializers.ModelSerializer):
    tags = TagSerializer(read_only=True, many=True)
    request_set = ItemRequestGETSerializer(read_only=True, many=True)
    class Meta:
        model = models.Item
        fields = ['id', 'name', 'photo_src', 'location', 'model', 'quantity', 'description', 'tags', 'request_set']

class ItemPOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Item
        fields = ['id', 'name', 'photo_src', 'location', 'model', 'quantity', 'description', 'tags']

class CartItemGETSerializer(serializers.ModelSerializer):
    item = ItemGETSerializer(read_only=True, many=False)
    owner = UserGETSerializer(read_only=True, many=False)
    class Meta:
        model = models.CartItem
        fields = ['id', 'item', 'owner', 'quantity']

class CartItemPOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.CartItem
        fields = ['id', 'item', 'owner', 'quantity']

class RequestGETSerializer(serializers.ModelSerializer):
    requester = UserGETSerializer(read_only=True, many=False)
    item      = ItemGETSerializer(read_only=True, many=False)
    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'item', 'quantity', 'date_open', 'open_reason']

class RequestPOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Request
        fields = ['id', 'requester', 'item', 'quantity', 'date_open', 'open_reason']

class RequestResponseGETSerializer(serializers.ModelSerializer):
    request       = RequestGETSerializer(read_only=True, many=False)
    administrator = UserGETSerializer(read_only=True, many=False)
    class Meta:
        model = models.RequestResponse
        fields = ['id', 'request', 'date_closed', 'closed_comment', 'administrator', 'status']

class RequestResponsePOSTSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.RequestResponse
        fields = ['id', 'request', 'date_closed', 'closed_comment', 'administrator', 'status']
