from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework import authentication, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from . import models, serializers
from rest_framework import pagination
from datetime import datetime

from django.utils import timezone

import requests


class ItemListCreate(generics.GenericAPIView):
    # authentication_classes = (authentication.TokenAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return models.Item.objects.all()

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def get(self, request):
        # CHECK PERMISSION
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    # manager restricted
    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        # check if we're trying to make a duplicate item
        existing_item = models.Item.objects.filter(name=request.data['name']).count() > 0
        if existing_item:
            return Response({"error": "An item with this name already exists."})

        # check that the starting quantity is non-negative
        quantity = None
        try:
            quantity = int(request.data.get('quantity', None))
        except:
            return Response({'quantity': 'Ensure this value is an integer.'})
        if quantity < 0:
            return Response({'quantity': 'Ensure this value is greater than or equal to 0.'})

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ItemDetailModifyDelete(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_instance(self, item_name):
        try:
            return models.Item.objects.get(name=item_name)
        except models.Item.DoesNotExist:
            raise NotFound('Item {} not found.'.format(item_name))

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def get_queryset(self):
        return models.Item.objects.all()

    def get(self, request, item_name):
        item = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=item)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, item_name):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        item = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # manager restricted
    def delete(self, request, item_name):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        item = self.get_instance(item_name=item_name)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class ItemAddToCart(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_item(self, item_name):
        try:
            return models.Item.objects.get(name=item_name)
        except models.Item.DoesNotExist:
            raise NotFound("Item '{}' not found.".format(item_name))

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # add an item to your cart
    # need to check if item already exists, and update if it does
    def post(self, request, item_name):
        request.data.update({'owner': request.user})
        request.data.update({'item': self.get_item(item_name)})

        cartitems = self.get_queryset().filter(item__name=item_name)
        if cartitems.count() > 0:
            serializer = self.get_serializer(instance=cartitems.first(), data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class CustomFieldListCreate(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CustomFieldSerializer

    def get_queryset(self):
        return models.CustomField.objects.all()

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        existing_field = self.get_queryset().filter(name=request.data['name']).count() > 0
        if existing_field:
            return Response({"error": "A field with this name already exists."})

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomFieldDetailDelete(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_instance(self, field_name):
        try:
            return models.CustomField.objects.get(name=field_name)
        except:
            raise NotFound("Field '{}' not found.".format(field_name))

    def get_serializer_class(self):
        return serializers.CustomFieldSerializer

    def get_queryset(self):
        return models.CustomField.objects.all()

    def get(self, request, field_name):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        custom_field = self.get_instance(field_name=field_name)
        serializer = self.get_serializer(instance=custom_field)
        return Response(serializer.data)

    def delete(self, request, field_name):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        custom_field = self.get_instance(field_name=field_name)
        custom_field.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



class CustomValueList(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CustomValueSerializer

    def get_queryset(self):
        queryset = models.CustomValue.objects.filter(item__name=self.kwargs['item_name'])
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(field__private=False)
        return queryset

    def get(self, request, item_name):
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)


class CustomValueDetailModify(generics.GenericAPIView):
    def get_instance(self, item_name, field_name):
        try:
            return self.get_queryset().get(field__name=field_name)
        except models.CustomValue.DoesNotExist:
            raise NotFound("Field '{}' not found on item '{}'.".format(field_name, item_name))

    def get_serializer_class(self):
        return serializers.CustomValueSerializer

    def get_queryset(self):
        queryset = models.CustomValue.objects.filter(item__name=self.kwargs['item_name'])
        if not (self.request.user.is_staff or self.request.user.is_superuser):
            queryset = queryset.filter(field__private=False)
        return queryset

    def get(self, request, item_name, field_name):
        custom_value = self.get_instance(item_name=item_name, field_name=field_name)
        serializer = self.get_serializer(instance=custom_value)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, item_name, field_name):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        custom_value = self.get_instance(item_name=item_name, field_name=field_name)
        # manually force the serializer data to have correct field name
        request.data.update({'name': field_name})
        serializer = self.get_serializer(instance=custom_value, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




class CartItemList(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # view all items in your cart
    def get(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)



class CartItemDetailModifyDelete(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_instance(self, item_name):
        try:
            return self.get_queryset().get(item__name=item_name)
        except models.CartItem.DoesNotExist:
            raise NotFound('Cart item {} not found.'.format(pk))

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # view all items in your cart
    def get(self, request, item_name):
        cartitem = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=cartitem)
        return Response(serializer.data)

    # modify quantity of an item in your cart
    def put(self, request, item_name):
        cartitem = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=cartitem, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # remove an item from your cart
    def delete(self, request, item_name):
        cartitem = self.get_instance(item_name=item_name)
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
def post_user_signup(request):
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

@api_view(['GET'])
@permission_classes((permissions.IsAuthenticated,))
def get_current_user(request, format=None):
    user = request.user
    return Response({
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
        "email": user.email,
        "is_superuser": user.is_superuser
    })


@api_view(['GET'])
@permission_classes((permissions.AllowAny,))
def get_netid_token(request, format=None):

    code = request.query_params.get('code')

    p = {'grant_type' : 'authorization_code', 'code' : code, 'redirect_uri' : 'http://127.0.0.1:8000/api/netidtoken/', 'client_id' : 'kipventory', 'client_secret' : '#4ay9FQFuAPQbv8urcj+R%kd@YtAY4@=ggUXWbuvxjMX2g3kWo'}

    token_request = requests.post('https://oauth.oit.duke.edu/oauth/token.php', data = p)
    token_json = token_request.json()
    print(token_json)

    headers = {'Accept' : 'application/json', 'x-api-key' : 'kipventory', 'Authorization' : 'Bearer '+token_json['access_token']}

    identity = requests.get('https://api.colab.duke.edu/identity/v1/', headers= headers)
    identity_json = identity.json()
    print(identity_json)
    netid = identity_json['netid']
    email = identity_json['eduPersonPrincipalName']
    user_count = User.objects.filter(username=netid).count()
    if user_count == 1:
        user = User.objects.get(username=netid)
        login(request, user)
        return redirect('/app/')
    elif user_count == 0:
        user = User.objects.create_user(username=netid,email=email, password=None)
        user.save()
        login(request, user)
        return redirect('/app/')
    else:
        print("Multiple NetId Users this is big time wrong need to throw an error")
        return redirect('/app/')
