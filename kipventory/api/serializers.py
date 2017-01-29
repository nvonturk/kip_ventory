from rest_framework import serializers
from . import models
from django.contrib.auth.models import User


class TagSerializer(serializers.ModelSerializer):
	class Meta:
		model = models.Tag
		fields = ('name')

class UserSerializer(serializers.ModelSerializer):
	class Meta:
		model = User
		fields = ('first_name', 'last_name', 'email')

class ItemSerializer(serializers.ModelSerializer):
    tags = TagSerializer(read_only=True, many=True)

    class Meta:
        model = models.Item
        fields = ('name', 'location', 'model', 'quantity', 'description', 'tags')


class RequestSerializer(serializers.ModelSerializer):
	requester = UserSerializer(read_only=True, many=False)
	items = ItemSerializer(read_only=True, many=True)

	class Meta:
		model = models.Request
		fields = ('requester', 'items', 'date_open')
