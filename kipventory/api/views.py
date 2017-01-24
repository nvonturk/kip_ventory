from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response

from . import models, serializers

# Create your views here.
class ItemListView(generics.ListAPIView):
    serializer_class = serializers.ItemSerializer

    def get_queryset(self):
        queryset = models.Item.objects.all()
        return queryset
