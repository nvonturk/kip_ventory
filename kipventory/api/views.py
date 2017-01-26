from django.shortcuts import render
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response

from . import models, serializers

# Create your views here.
class ItemListView(generics.ListCreateAPIView):
	queryset = models.Item.objects.all()
	serializer_class = serializers.ItemSerializer