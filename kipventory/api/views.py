from django.shortcuts import render
from rest_framework import generics, mixins
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import authentication, permissions
from rest_framework.decorators import api_view, permission_classes

from django.db.models import Q
from django.http.request import QueryDict
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from . import models, serializers
from rest_framework import pagination
from datetime import datetime

from django.utils import timezone


class ItemListCreate(generics.GenericAPIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        return models.Item.objects.all()

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def get(self, request, format=None):
        # CHECK PERMISSION
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    # manager restricted
    def post(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "You do not have permission to create items."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        existing_item = models.Item.objects.filter(name=request.data['name']).first()
        if existing_item:
            return Response({"error": "An item with this name already exists."})

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ItemDetailModifyDelete(generics.GenericAPIView):
    permissions = (permissions.AllowAny,)

    def get_instance(self, pk):
        try:
            return models.Item.objects.get(pk=pk)
        except models.Item.DoesNotExist:
            raise Http404

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def get_queryset(self):
        return models.Item.objects.all()

    def get(self, request, pk, format=None):
        item = self.get_instance(pk)
        serializer = self.get_serializer(instance=item)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, pk, format=None):
        item = self.get_instance(pk)
        serializer = self.get_serializer(instance=item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # manager restricted
    def delete(self, request, pk, format=None):
        item = self.get_instance(pk)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class CustomFieldListCreate(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CustomFieldSerializer

    def get_queryset(self):
        return models.CustomField.objects.all()

    def get(self, request, ipk, format=None):
        queryset = self.get_queryset().filter(item=ipk)
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    # manager restricted
    def post(self, request, ipk, format=None):
        item = self.get_queryset().get(pk=ipk)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(item=item)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomFieldDetailModifyDelete(generics.GenericAPIView):
    def get_instance(self, pk):
        try:
            return models.CustomField.objects.get(pk=pk)
        except models.CustomField.DoesNotExist:
            raise Http404

    def get_serializer_class(self):
        return serializers.CustomFieldSerializer

    def get_queryset(self):
        return models.CustomField.objects.all()

    def get(self, request, ipk, fpk, format=None):
        custom_field = self.get_instance(pk=fpk)
        serializer = self.get_serializer(instance=custom_field)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, ipk, fpk, format=None):
        custom_field = self.get_instance(pk=fpk)
        serializer = self.get_serializer(instance=custom_field, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # manger restricted
    def delete(self, request, ipk, fpk, format=None):
        custom_field = self.get_instance(pk=fpk)
        custom_field.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class CartItemListCreate(generics.GenericAPIView):
    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # view all items in your cart
    def get(self, request, format=None):
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    # add an item to your cart
    # need to check if item already exists, and update if it does
    def post(self, request, format=None):
        cartitems = self.get_queryset().filter(item__pk=request.data['item'])
        if cartitems.count() > 0:
            serializer = self.get_serializer(instance=cartitems.first(), data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CartItemDetailModifyDelete(generics.GenericAPIView):
    def get_instance(self, pk):
        try:
            return models.CartItem.objects.get(pk=pk)
        except models.CartItem.DoesNotExist:
            raise Http404

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner=self.request.user.pk)

    # view all items in your cart
    def get(self, request, pk, format=None):
        cartitem = self.get_instance(pk=pk)
        serializer = self.get_serializer(instance=cartitem)
        return Response(serializer.data)

    # modify quantity of an item in your cart
    def put(self, request, pk, format=None):
        cartitem = self.get_instance(pk=pk)
        serializer = self.get_serializer(instance=cartitem, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # remove an item from your cart
    def delete(self, request, pk, format=None):
        cartitem = self.get_instance(pk=pk)
        cartitem.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def post_user_login(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return redirect('/app/')
    else:
        # Return an 'invalid login' error message.
        messages.add_message(request._request, messages.ERROR, 'invalid-login-credentials')
        return redirect('/')


@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def post_user_signup(request, format=None):
    username = request.data['username']
    password = request.data['password']
    first_name = request.data['first_name']
    last_name = request.data['last_name']
    email = request.data['email']

    exists = (User.objects.filter(username=username).count() > 0)
    if exists:
        messages.add_message(request._request, messages.ERROR, "username-taken")
        return redirect('/')

    user = User.objects.create_user(
                            username=username,
                            email=email,
                            password=password,
                            first_name=first_name,
                            last_name=last_name)
    messages.add_message(request._request, messages.SUCCESS, "user-created")
    return redirect('/')
