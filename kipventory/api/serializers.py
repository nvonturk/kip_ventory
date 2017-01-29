from rest_framework import serializers
from . import models


class ItemSerializer(serializers.ModelSerializer):
     class Meta:
        model = models.Item
        fields = ('part_no', 'name', 'location', 'quantity', 'description')


class Tag(serializers.ModelSerializer):
	class Meta:
		model = models.Tag
		fields = ('name')


class User(serializers.ModelSerializer):
    class Meta:
        model = models.User
        fields = ()
