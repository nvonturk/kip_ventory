from django.shortcuts import render
from rest_framework import generics, mixins
from rest_framework import status
from rest_framework.response import Response

from . import models, serializers
from django.db.models import Q

from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from django.contrib.auth.decorators import login_required

from rest_framework.authtoken.models import Token

from django.shortcuts import redirect

import json

# Create your views here.
class ItemView(generics.GenericAPIView,
               mixins.ListModelMixin,
               mixins.RetrieveModelMixin,
               mixins.CreateModelMixin,
               mixins.DestroyModelMixin):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        search = self.request.query_params.get("search")
        tags = self.request.query_params.get("tags")
        q_objs = Q()
        if search is not None:
            q_objs |= Q(name__icontains=search) | Q(model__icontains=search)
        if tags is not None and tags != '':
        	#todo do we want OR or AND logic? right not it is OR
        	tagsArray = tags.split(",")
        	q_objs &= Q(tags__name__in=tagsArray)

        queryset = models.Item.objects.filter(q_objs).distinct()
        return queryset

    def get_serializer_class(self):
        if self.request.method == "POST":
            return serializers.ItemPOSTSerializer
        return serializers.ItemGETSerializer

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs.keys():
            return self.retrieve(request, args, kwargs)
        return self.list(request, args, kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, args, kwargs)


class CartView(generics.GenericAPIView,
               mixins.ListModelMixin,
               mixins.RetrieveModelMixin,
               mixins.CreateModelMixin,
               mixins.UpdateModelMixin,
               mixins.DestroyModelMixin):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        ''' Only allow a user/admin to see his own cart items'''
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    def get_serializer_class(self):
        '''Use a smaller representation if we're POSTing'''
        if self.request.method == "POST":
            return serializers.CartItemPOSTSerializer
        return serializers.CartItemGETSerializer

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs.keys():
            return self.retrieve(request, args, kwargs)
        return self.list(request, args, kwargs)

    def post(self, request, *args, **kwargs):
        print(args)
        print(kwargs)
        return self.create(request, args, kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)




class RequestView(generics.GenericAPIView,
                  mixins.ListModelMixin,
                  mixins.CreateModelMixin,
                  mixins.DestroyModelMixin):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        ''' Only allow a user/admin to see his own cart items'''
        return models.Request.objects.filter(requester__pk=self.request.user.pk)

    def get_serializer_class(self):
        '''Use a smaller representation if we're POSTing'''
        if self.request.method == "POST":
            return serializers.RequestPOSTSerializer
        return serializers.RequestGETSerializer

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs.keys():
            return self.retrieve(request, args, kwargs)
        return self.list(request, args, kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)



class TagListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = serializers.TagSerializer

    def get_queryset(self):
        queryset = models.Tag.objects.all()
        return queryset
