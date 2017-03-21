from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response
from rest_framework import authentication, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotFound
from rest_framework.authtoken.models import Token



from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render, get_object_or_404
from django.contrib import messages
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.db.models import Q

from . import models, serializers
from rest_framework import pagination
from datetime import datetime
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.contrib.auth.forms import PasswordResetForm
from django.contrib.auth.views import password_reset, password_reset_confirm

import requests, csv, os


class CustomPagination(pagination.PageNumberPagination):
    page_query_param = 'page'
    page_size_query_param = 'itemsPerPage'

    def get_paginated_response(self, data):
        '''
        return Response({
            'num_pages': self.page.paginator.num_pages,
            'count': self.page.paginator.count,
            'results': data
        })
        '''
        return Response({
             "count": self.page.paginator.count,
             "num_pages": self.page.paginator.num_pages,
             "results": data
            })




class ItemListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Item.objects.all()

    def get_serializer_class(self):
        return serializers.ItemSerializer

    def filter_queryset(self, queryset, request):
        # Search and Tag Filtering
        search = self.request.query_params.get("search")
        tags = self.request.query_params.get("tags")
        excludeTags = self.request.query_params.get("excludeTags")
        q_objs = Q()

        # Search filter
        if search is not None and search!='':
            q_objs &= (Q(name__icontains=search) | Q(model_no__icontains=search))

        queryset = queryset.filter(q_objs).distinct()

        # Tags filter
        if tags is not None and tags != '':
            tagsArray = tags.split(",")
            for tag in tagsArray:
                queryset = queryset.filter(tags__name=tag)

        # Exclude tags filter
        if excludeTags is not None and excludeTags != '':
            excludeTagsArray = excludeTags.split(",")
            for tag in excludeTagsArray:
                queryset = queryset.exclude(tags__name=tag)

        return queryset

    def get(self, request, format=None):
        # CHECK PERMISSION
        queryset = self.get_queryset()
        queryset = self.filter_queryset(queryset, request)

        # Pagination
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

    # manager restricted
    def post(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Permission denied."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            itemCreationLog(serializer.data, request.user.pk)
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

    def get(self, request, item_name, format=None):
        item = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=item)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, item_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        item = self.get_instance(item_name=item_name)

        serializer = self.get_serializer(instance=item, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            itemModificationLog(serializer.data, request.user.pk)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # manager restricted
    def delete(self, request, item_name, format=None):
        if not (request.user.is_superuser):
            d = {"error": "Administrator permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        item = self.get_instance(item_name=item_name)
        item.delete()
        # Insert Create Log
        # Need {serializer.data, initiating_user_pk, 'Item Changed'}
        itemDeletionLog(item_name, request.user.pk)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddItemToCart(generics.GenericAPIView):
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
    def post(self, request, item_name, format=None):
        item = self.get_item(item_name)

        data = request.data.copy()
        data.update({'owner': request.user})
        data.update({'item': item})

        cartitems = self.get_queryset().filter(item__name=item_name)
        if cartitems.count() > 0:
            serializer = self.get_serializer(instance=cartitems.first(), data=data)
        else:
            serializer = self.get_serializer(data=data)

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

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

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

    def get(self, request, field_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        custom_field = self.get_instance(field_name=field_name)
        serializer = self.get_serializer(instance=custom_field)
        return Response(serializer.data)

    def delete(self, request, field_name, format=None):
        if not (request.user.is_superuser):
            d = {"error": "Manager permissions required."}
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

    def get(self, request, item_name, format=None):
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

    def get(self, request, item_name, field_name, format=None):
        custom_value = self.get_instance(item_name=item_name, field_name=field_name)
        serializer = self.get_serializer(instance=custom_value)
        return Response(serializer.data)

    # manager restricted
    def put(self, request, item_name, field_name, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()

        custom_value = self.get_instance(item_name=item_name, field_name=field_name)
        # manually force the serializer data to have correct field name
        data.update({'name': field_name})
        serializer = self.get_serializer(instance=custom_value, data=data, partial=True)
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
    def get(self, request, format=None):
        queryset = self.get_queryset()
        serializer = self.get_serializer(instance=queryset, many=True)

        return Response(serializer.data)


class CartItemDetailModifyDelete(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_instance(self, item_name):
        try:
            return self.get_queryset().get(item__name=item_name)
        except models.CartItem.DoesNotExist:
            raise NotFound('Cart item {} not found.'.format(item_name))

    def get_serializer_class(self):
        return serializers.CartItemSerializer

    # restrict this queryset - each user can only see his/her own cart items
    def get_queryset(self):
        return models.CartItem.objects.filter(owner__pk=self.request.user.pk)

    # view all items in your cart
    def get(self, request, item_name, format=None):
        cartitem = self.get_instance(item_name=item_name)
        serializer = self.get_serializer(instance=cartitem)
        return Response(serializer.data)

    # modify quantity of an item in your cart
    def put(self, request, item_name, format=None):
        cartitem = self.get_instance(item_name=item_name)
        data = request.data.copy()

        data.update({'owner': request.user})
        data.update({'item': cartitem.item})

        serializer = self.get_serializer(instance=cartitem, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # remove an item from your cart
    def delete(self, request, item_name, format=None):
        cartitem = self.get_instance(item_name=item_name)
        cartitem.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GetOutstandingRequestsByItem(generics.GenericAPIView):
    permissions = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, item_name, format=None):
        requests = self.get_queryset()
        if request.user.is_staff or request.user.is_superuser:
            requests = models.Request.objects.filter(requested_items__item__name=item_name)
        else:
            requests = models.Request.objects.filter(requested_items__item__name=item_name, requester=request.user.pk)

        # Return all items if query parameter "all" is set
        all_items = self.request.query_params.get("all", None)
        if all_items:
            serializer = self.get_serializer(instance=requests, many=True)
            return Response({"results": serializer.data, "count" : 1, "num_pages": 1})

        # Pagination
        paginated_queryset = self.paginate_queryset(requests)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response


class RequestListAll(generics.GenericAPIView):
    pagination_class = CustomPagination
    def get_queryset(self):
        return models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        queryset = self.get_queryset()
        status = request.GET.get('status')
        if not (status is None or status=="All"):
            queryset = models.Request.objects.filter(status=status)

        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

class RequestListCreate(generics.GenericAPIView):
    authentication_classes = (authentication.SessionAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    # restrict this queryset - each user can only see his/her own Requests
    def get_queryset(self):
        return models.Request.objects.filter(requester__pk=self.request.user.pk)

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()
        status = request.GET.get('status')
        if not (status is None or status=="All"):
            queryset = models.Request.objects.filter(status=status)
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

    # generate a request that contains all items currently in your cart.
    def post(self, request, format=None):
        data = request.data.copy()
        data.update({'requester': request.user})

        cart_items = models.CartItem.objects.filter(owner__pk=self.request.user.pk)
        if cart_items.count() <= 0:
            d = {"error": ["There are no items in your cart. Add an item to your cart in order to request it."]}
            return Response(d, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            request_instance = serializer.save()

        for ci in cart_items:
            req_item = models.RequestedItem.objects.create(request=request_instance,
                                                           item=ci.item,
                                                           quantity=ci.quantity,
                                                           request_type=ci.request_type,
                                                           due_date=ci.due_date)
            # Insert Create Log
            # Need {serializer.data, initiating_user_pk, 'Request Created'}
            req_item.save()
            requestItemCreation(req_item, request.user.pk, request_instance)
            ci.delete()

        serializer = self.get_serializer(instance=request_instance)
        return Response(serializer.data)

class RequestDetailModifyDelete(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_instance(self, request_pk):
        try:
            return models.Request.objects.get(pk=request_pk)
        except models.Request.DoesNotExist:
            raise NotFound('Request with ID {} not found.'.format(request_pk))

    def get_queryset(self):
        return models.Request.objects.filter(requester__pk=self.request.user.pk)

    def get_serializer_class(self):
        if self.request.method == 'PUT':
            return serializers.RequestPUTSerializer
        return serializers.RequestSerializer

    # MANAGER/OWNER LOCKED
    def get(self, request, request_pk, format=None):
        instance = self.get_instance(request_pk)
        # if admin, see any request.
        # if user, only see your requests
        is_owner = (instance.requester.pk == request.user.pk)
        if not (request.user.is_staff or request.user.is_superuser or is_owner):
            d = {"error": "Manager or owner permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(instance=instance)
        return Response(serializer.data)

    # MANAGER LOCKED - only admins may change the fields on a request
    def put(self, request, request_pk, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data.update({'administrator': request.user})
        instance = self.get_instance(request_pk)
        serializer = self.get_serializer(instance=instance, data=data, partial=True)

        if serializer.is_valid():
            # check integrity of approval operation
            if data['status'] == 'D':
                # Insert Create Log
                # Need {serializer.data, initiating_user_pk, 'Request Approved'}
                for ri in instance.requested_items.all():
                    requestItemDenial(ri, request.user.pk, instance)
            elif data['status'] == 'A':
                valid_request = True
                for ri in instance.requested_items.all():
                    if (ri.quantity > ri.item.quantity):
                        valid_request = False
                        break
                # decrement quantity available on each item in the approved request
                if valid_request:
                    for ri in instance.requested_items.all():
                        ri.item.quantity = (ri.item.quantity - ri.quantity)
                        ri.item.save()
                        # create a loan or disbursement object
                        print(ri.request_type)
                        if ri.request_type == models.LOAN:
                            loan = models.createLoanFromRequestItem(ri)
                            loan.save()
                            print(loan)
                        elif ri.request_type == models.DISBURSEMENT:
                            disbursement = models.createDisbursementFromRequestItem(ri)
                            disbursement.save()
                            print(disbursement)

                        # Insert Create Log
                        # Need {serializer.data, initiating_user_pk, 'Request Approved'}
                        requestItemApproval(ri, request.user.pk, instance)
                else:
                    return Response({"error": "Cannot satisfy request."}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # OWNER LOCKED
    def delete(self, request, request_pk, format=None):
        instance = self.get_instance(request_pk)
        is_owner = (request.user.pk == instance.requester.pk)
        if not (is_owner):
            d = {"error": "Owner permissions required"}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        if not (instance.status == 'O'):
            d = {"error": "Cannot delete an approved/denied request."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        instance.delete()
        # Don't post log here since its as if it never happened
        return Response(status=status.HTTP_204_NO_CONTENT)


class RequestedItemDetailModifyDelete(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_requested_item(self, request_pk, item_name):
        try:
            return models.RequestedItem.objects.filter(request__pk=request_pk).get(item__name=item_name)
        except models.RequestedItem.DoesNotExist:
            raise NotFound("Item '{}' could not be found in Request with primary key '{}'".format(item_name, request_pk))

    def get_queryset(self):
        return models.RequestedItems.objects.filter(request__pk=request_pk)

    def get_serializer_class(self):
        return serializers.RequestedItemSerializer

    def get(self, request, request_pk, item_name, format=None):
        ri = self.get_requested_item(request_pk, item_name)
        serializer = self.get_serializer(instance=ri)
        return Response(serializer.data)

    def put(self, request, request_pk, item_name, format=None):
        ri = self.get_requested_item(request_pk, item_name)
        data = request.data.copy()
        serializer = self.get_serializer(instance=ri, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, request_pk, item_name, format=None):
        ri = self.get_requested_item(request_pk, item_name)
        ri.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def post_user_login(request, format=None):
    username = request.data.get('username', None)
    password = request.data.get('password', None)
    next_url = request.data.get('next', None)

    user = authenticate(username=username, password=password)

    if hasattr(user, 'kipventory_user'):
        if user.kipventory_user.is_duke_user:
            messages.add_message(request._request, messages.ERROR, 'login-via-duke-authentication')
            return redirect('/')

    if user is not None:
        login(request, user)
        if len(next_url) > 0:
            return redirect(next_url)
        return redirect('/app/inventory/')
    else:
        # Return an 'invalid login' error message.
        messages.add_message(request._request, messages.ERROR, 'invalid-login-credentials')
        print("ERROR")
        return redirect('/')

class UserList(generics.GenericAPIView):
    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        return serializers.UserGETSerializer

    def get(self, request, format=None):
        users = self.get_queryset()
        serializer = self.get_serializer(instance=users, many=True)
        return Response(serializer.data)

class UserCreate(generics.GenericAPIView):
    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        return serializers.UserPOSTSerializer

    def post(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = User.objects.create_user(**serializer.validated_data)
            #todo do we log this for net id creations?
            userCreationLog(serializer.data, request.user.pk)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetCurrentUser(generics.GenericAPIView):
    queryset = None
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = None

    def get(self, request, format=None):
        user = request.user
        return Response({
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser
        })

@api_view(['PUT'])
@permission_classes((permissions.IsAuthenticated,))
def edit_user(request, username, format=None):
    if request.method == 'PUT':
        if not request.user.is_superuser:
            return Response(status=status.HTTP_403_FORBIDDEN)
        updatedUser = request.data
        user = models.User.objects.get(username=updatedUser['username'])
        serializer = serializers.UserPUTSerializer(instance=user, data=updatedUser, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GetNetIDToken(generics.GenericAPIView):
    queryset = None
    permission_classes = (permissions.AllowAny,)
    serializer_class = None

    def get(self, request, format=None):
        code = request.query_params.get('code')

        p = {'grant_type' : 'authorization_code', 'code' : code, 'redirect_uri' : "https://colab-sbx-226.oit.duke.edu/api/netidtoken/", 'client_id' : 'kipventory', 'client_secret' : 'sn6j#IzL*PXUxmPKvJ7Gs+1vzukxlx#yoFDnh%WI7GzLs$=1so'}

        token_request = requests.post('https://oauth.oit.duke.edu/oauth/token.php', data = p)
        token_json = token_request.json()

        headers = {'Accept' : 'application/json', 'x-api-key' : 'kipventory', 'Authorization' : 'Bearer '+token_json['access_token']}

        identity = requests.get('https://api.colab.duke.edu/identity/v1/', headers= headers)
        identity_json = identity.json()

        netid = identity_json['netid']
        email = identity_json['eduPersonPrincipalName']
        first_name = identity_json['firstName']
        last_name = identity_json['lastName']

        user_count = User.objects.filter(username=netid).count()
        if user_count == 1:
            user = User.objects.get(username=netid)
            login(request, user)
            return redirect('/app/')
        elif user_count == 0:
            user = User.objects.create_user(username=netid, email=email, password=None, first_name=first_name, last_name=last_name)
            login(request, user)
            return redirect('/app/')
        else:
            print("Multiple NetId Users this is big time wrong need to throw an error")
            return redirect('/app/')


class TagListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.TagSerializer
    pagination_class = CustomPagination

    def get_instance(self, tag_name):
        try:
            return models.Tag.objects.get(name=tag_name)
        except models.Tag.DoesNotExist:
            raise NotFound('Tag {} not found.'.format(tag_name))

    def get_queryset(self):
        return models.Tag.objects.all()

    def get(self, request, format=None):
        tags = self.get_queryset()

        paginated_tags = self.paginate_queryset(tags)

        if(request.query_params.get("all") == "true"):
            serializer = self.get_serializer(instance=tags, many=True)
            return Response(serializer.data)
        else:
            serializer = self.get_serializer(instance=paginated_tags, many=True)
            response = self.get_paginated_response(serializer.data)
            return response

        # return response

    def post(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Maybe put into its own view? Seems like a lot for now
    # manager restricted
    def delete(self, request, format=None):
        if not (request.user.is_staff):
            d = {"error": "Administrator permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        tag = self.get_instance(tag_name=request.query_params.get("name"))
        tag.delete()
        # Insert Delete Log
        # Need {serializer.data, initiating_user_pk, 'Item Changed'}
        # itemDeletionLog(item_name, request.user.pk)
        #TODO NEED TO LOG DELETION HERE
        return Response(status=status.HTTP_204_NO_CONTENT)


class LogList(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Log.objects.all()

    def get_serializer_class(self):
        return serializers.LogSerializer

    def get(self, request, format=None):
        if not (request.user.is_staff or request.user.is_superuser):
            # Not allowed to see logs if not manager/admin
            return Response(status=status.HTTP_403_FORBIDDEN)

        user = request.query_params.get("user")
        item = request.query_params.get("item")
        endDate = request.query_params.get("endDate")
        startDate = request.query_params.get("startDate")
        # print("StartDate:" + startDate)
        # print("EndDate:", endDate)
        # Create Datetimes from strings
        logs = self.get_queryset()
        q_objs = Q()
        if user is not None and user != '':
            q_objs &= (Q(affected_user__username=user) | Q(initiating_user__username=user))
        logs = logs.filter(q_objs).distinct()
        if item is not None and item != '':
            logs = logs.filter(item__name=item)
        if startDate is not None and startDate != '' and endDate is not None and endDate != '':
            startDate, endDate = startDate.split(" "), endDate.split(" ")
            stimeZone, etimeZone = startDate[5], endDate[5]
            stimeZone, etimeZone = stimeZone.split('-'), etimeZone.split('-')
            startDate, endDate = startDate[:5], endDate[:5]
            startDate, endDate = " ".join(startDate), " ".join(endDate)
            startDate, endDate = startDate + " " + stimeZone[0], endDate + " " + etimeZone[0]

            print(startDate, endDate)

            startDate = datetime.strptime(startDate, "%a %b %d %Y %H:%M:%S %Z").date()
            endDate = datetime.strptime(endDate, "%a %b %d %Y %H:%M:%S %Z").date()
            startDate = datetime.combine(startDate, datetime.min.time())
            endDate = datetime.combine(endDate, datetime.max.time())
            startDate = timezone.make_aware(startDate, timezone.get_current_timezone())
            endDate = timezone.make_aware(endDate, timezone.get_current_timezone())

            print(startDate, endDate)

            logs = logs.filter(date_created__range=[startDate, endDate])

        queryset = logs
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response



class TransactionListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = CustomPagination

    def get_queryset(self):
        return models.Transaction.objects.all()

    def get_serializer_class(self):
        return serializers.TransactionSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()
        category = request.GET.get('category')
        if not (category is None or category=="All"):
            queryset = models.Transaction.objects.filter(category=category)

        # Return all items if query parameter "all" is set
        all_items = self.request.query_params.get("all", None)
        if all_items:
            serializer = self.get_serializer(instance=queryset, many=True)
            return Response({"results": serializer.data, "count" : 1, "num_pages": 1})

        # Pagination
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        print(serializer.data)
        return response


    def post(self, request, format=None):
        #todo django recommends doing this in middleware
        data = request.data.copy()

        data['administrator'] = request.user
        serializer = self.get_serializer(data=data)
        if serializer.is_valid(): #todo could move the validation this logic into serializer's validate method
            transaction_quantity = int(data['quantity'])
            if transaction_quantity < 0:
                return Response({"quantity": "Quantity be a positive integer"}, status=status.HTTP_400_BAD_REQUEST)

            item = models.Item.objects.get(name=data['item'])
            if data['category'] == 'Acquisition':#models.ACQUISITION:
                new_quantity = item.quantity + transaction_quantity
            elif data['category'] == 'Loss':#models.LOSS:
                new_quantity = item.quantity - transaction_quantity
                if new_quantity < 0:
                    return Response({"quantity": "Cannot remove more items from the inventory than currently exists"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                #should never get here
                pass
            item.quantity = new_quantity
            item.save()
            transactionCreationLog(item, request.user.pk, request.data['category'], transaction_quantity)
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TokenPoint(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        if Token.objects.filter(user=request.user).count() > 0:
            #User has a token, return created token
            print(Token.objects.get(user=request.user).key)
            return Response({"token": Token.objects.get(user=request.user).key})
        else:
            token = Token.objects.create(user=request.user)
            print(token.key)
            return Response({"token": token.key})

class BulkImport(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, format=None):
        if not request.user.is_superuser:
            d = {"error": "Manager permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)
        else:
            data = request.data.copy()
            data.update({"administrator": request.user})
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                inputfile = request.FILES['data']
                fout = open(inputfile.name, 'wb')
                for chunk in inputfile.chunks():
                    fout.write(chunk)
                fout.close()
                f = open('./' + inputfile.name, 'r')
                reader = csv.reader(f)
                # Create a list for each column
                columns = []
                counter = 0
                for row in reader:
                    if counter == 0:
                        for i in range(len(row)):
                            columns.append([row[i]])
                        counter = 1
                    else:
                        for i in range(len(row)):
                            columns[i].append(row[i])
                # Check each column to make sure type is correct
                # name, quantity, model_no, description, tags, ... custom fields
                # top row will be those headers
                col_no = 1
                for col in columns:
                    header = col[0]
                    row_no = 2
                    for entry in col[1:]:
                        validation = self.checkEntry(header, entry)
                        if validation[0] == 'error':
                            message = validation[1] + " in table location: " + str(row_no) + ", " + str(col_no)
                            return Response({"error": message})
                        row_no = row_no + 1
                    col_no = col_no + 1
                # All data is now validated
                # Ready to build items

                for i in range(1, len(columns[0])):

                    name_index = None
                    name = None
                    quantity_index = None
                    quantity = None
                    model_no_index = None
                    model_no = None
                    model_no_flag = True
                    description_index = None
                    description = None
                    description_flag = True
                    tags_index = None
                    tags = None
                    tags_flag = True

                    try:
                        name_index          = self.findIndex(columns, 'name')
                        name=columns[name_index][i]
                    except:
                        return Response({"error": 'No column specifying item names'})
                    try:
                        quantity_index      = self.findIndex(columns, 'quantity')
                        quantity=int(columns[quantity_index][i])
                    except:
                        return Response({"error": 'No column specifying item quantities'})
                    try:
                        model_no_index      = self.findIndex(columns, 'model_no')
                        model_no=columns[model_no_index][i]
                    except:
                        model_no_flag = False
                    try:
                        description_index   = self.findIndex(columns, 'description')
                        description=columns[description_index][i]
                    except:
                        description_flag = False
                    try:
                        tags_index = self.findIndex(columns, 'tags')
                        split_tags = [tag.strip() for tag in columns[tags_index][i].split(',')]
                    except:
                        tags_flag = False

                    curr_item = models.Item.objects.create(name=name, quantity=quantity)

                    if model_no_flag:
                        setattr(curr_item, 'model_no', model_no)
                    if description_flag:
                        setattr(curr_item, 'description', description)
                    if tags_flag:
                        all_tags = models.Tag.objects.all()
                        for tag_name in split_tags:
                            try:
                                curr_tag = all_tags.get(name=tag_name)
                            except:
                                curr_tag = models.Tag.objects.create(name=tag_name)
                            curr_item.tags.add(curr_tag)

                    # Need to find the columns that dont have stock headers
                    # In order to generate custom values

                    cfs = self.returnCustomFields(columns)
                    print("Custom field columns are:", cfs)
                    if len(cfs) > 0:
                        # Generate custom values with the custom fields in csv
                        for cf in cfs:
                            # First get the type of the custom field from the cf first entry
                            cf_obj = models.CustomField.objects.get(name=cf[0])
                            field_type = getattr(cf_obj, 'field_type')
                            # Based on the field type, need to create Custom Value for
                            # each Item row with values

                            # i is the row index, cf[1] is col index of entry

                            cv_obj = models.CustomValue.objects.create(field=cf_obj, item=curr_item)
                            if field_type == 'Single':
                                print("in assigning Single")
                                print(columns[cf[1]][i])
                                setattr(cv_obj, 'Single', columns[cf[1]][i])
                            elif field_type == 'Multi':
                                setattr(cv_obj, 'Multi', columns[cf[1]][i])
                            elif field_type == 'Int':
                                setattr(cv_obj, 'Int', int(columns[cf[1]][i]))
                            elif field_type == 'Float':
                                setattr(cv_obj, 'Int', float(columns[cf[1]][i]))
                            else:
                                print("Weird Field Type")
                            cv_obj.save()

                    curr_item.save()

                serializer.save()
                os.remove('./' + inputfile.name)
                return Response({"success": "upload successful"})
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def findIndex(self, columns, header):
        for i in range(len(columns)):
            if columns[i][0] == header:
                return i
        else:
            return None

    def isFloat(self, value):
        try:
            float(value)
            return True
        except ValueError:
            return False

    def isInt(self, value):
        try:
            int(value)
            return True
        except ValueError:
            return False

    def returnCustomFields(self, columns):
        stock_headers = ['name', 'quantity', 'model_no', 'description', 'tags']
        custom_fields = []
        for i in range(len(columns)):
            if columns[i][0] not in stock_headers:
                custom_fields.append((columns[i][0], i))
        return custom_fields




    def checkEntry(self, header, entry):
        # respond with 1. success or error 2. message
        error = 'error'
        success = 'success'
        if (header == 'name'):
            # Need to check if unique
            if len(models.Item.objects.filter(name=entry)) > 0:
                return (error, 'Item name not unique')
            # Check if name length exceeded
            elif len(entry) > 100:
                return (error, 'Item name exceeded max length of 100')
            elif len(entry) == 0:
                return (error, 'Item name cannot be blank')
            else:
                return (success, 'Item name is valid')
        elif (header == 'quantity'):
            # Check if quantity entry is a digit
            if len(entry) == 0:
                return (error, 'Item quantity cannot be blank')
            elif not entry.isdigit():
                return (error, 'Item quantity not positive integer')
            else:
                return (success, 'Item quantity is valid')
        elif (header == 'model_no'):
            # Check for length
            if len(entry) > 100:
                return (error, 'Item model_no exceeded max length of 100')
            else:
                return (success, 'Item model_no is valid')
        elif (header == 'description'):
            # Check for length
            if len(entry) > 500:
                return (error, 'Item description exceeded max length of 500')
            else:
                return (success, 'Item description is valid')
        elif (header == 'tags'):
            tags = [tag.strip() for tag in entry.split(',')]
            for tag in tags:
                if len(tag) > 100:
                    return (error, 'Item tag exceeded max length of 100')
            return (success, 'Item tags are valid')
        else:
            # Custom field
            if len(models.CustomField.objects.filter(name=header)) == 0:
                return (error, 'Unrecognized custom field')
            else:
                # Check to make sure that for each custom field, the entry is correct
                # Get the type of the custom field from header
                cf = models.CustomField.objects.get(name=header)
                field_type = getattr(cf, 'field_type')
                # FIELD_TYPES = (
                #     ('Single', 'Single-line text'),
                #     ('Multi', 'Multi-line text'),
                #     ('Int', 'Integer'),
                #     ('Float', 'Float'),
                # )
                if field_type == 'Single':
                    if isinstance(entry, str):
                        return (success, 'Item custom field is a string')
                    else:
                        return (error, 'Item custom field not a string')
                elif field_type == 'Multi':
                    if isinstance(entry, str):
                        return (success, 'Item custom field is a string')
                    else:
                        return (error, 'Item custom field not a string')
                elif field_type == 'Int':
                    if self.isInt(entry):
                        return (success, 'Item custom field is an Integer')
                    else:
                        return (error, 'Item custom field not an Integer')
                elif field_type == 'Float':
                    if self.isFloat(entry):
                        return (success, 'Item custom field is a Float')
                    else:
                        return (error, 'Item custom field not a Float')
                else:
                    return (error, 'Unrecognized field type')

    def get_serializer_class(self):
        return serializers.BulkImportSerializer

    def get_queryset(self):
        return models.BulkImport.Objects.all()


class DisburseCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def post(self, request, format=None):
        # check that all item names and quantities are valid
        errors = {}

        # validate user input
        data = {}
        data.update(request.data)
        requester = data.get('requester')[0]
        closed_comment = data.get('closed_comment')[0]
        items = data['items']
        quantities = data['quantities']

        try:
            requester = User.objects.get(username=requester)
        except User.DoesNotExist:
            return Response({"error": "Could not find user with username '{}'".format(requester)})

        data = {}
        data.update({'requester': requester, 'open_comment': "Administrative disbursement to user '{}'".format(requester.username)})

        # Verify that the disbursement quantities are valid (ie. less than or equal to inventory stock)
        for i in range(len(items)):
            item = None
            try:
                item = models.Item.objects.get(name=items[i])
            except models.Item.DoesNotExist:
                return Response({"error": "Item '{}' not found.".format(items[i])})
            items[i] = item
            # convert to int
            quantity = int(quantities[i])
            quantities[i] = quantity
            if quantity > item.quantity:
                errors.update({'error': "Request for {} instances of '{}' exceeds current stock of {}.".format(quantity, item.name, item.quantity)})

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # if we made it here, we know we can go ahead and create the request, all the request items, and approve it
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            request_instance = serializer.save()

        data = {}
        data.update({'administrator': request.user})
        data.update({'closed_comment': closed_comment})
        data.update({'status': 'A'})

        serializer = serializers.RequestPUTSerializer(instance=request_instance, data=data, partial=True)

        # We're good to go!
        if serializer.is_valid():
            for item, quantity in zip(items, quantities):
                # Create the request item
                req_item = models.RequestedItem.objects.create(item=item, quantity=quantity, request=request_instance)
                req_item.save()

                # Decrement the quantity remaining on the Item
                setattr(item, 'quantity', (item.quantity - quantity))
                item.save()

                # Logging
                requestItemCreation(req_item, request.user.pk, request_instance)
                requestItemApproval(req_item, request.user.pk, request_instance)

            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



def itemCreationLog(data, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        item = models.Item.objects.get(name=data['name'])
    except models.Item.DoesNotExist:
        raise NotFound('Item {} not found.'.format(data['name']))
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    quantity = data['quantity']
    message = 'Item {} created by {}'.format(data['name'], initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Item Creation', message=message, affected_user=affected_user)
    log.save()

def itemModificationLog(data, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        item = models.Item.objects.get(name=data['name'])
    except models.Item.DoesNotExist:
        raise NotFound('Item {} not found.'.format(data['name']))
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    quantity = data['quantity']
    message = 'Item {} modified by {}'.format(data['name'], initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Item Modification', message=message, affected_user=affected_user)
    log.save()

def itemDeletionLog(item_name, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Item {} deleted by {}'.format(item_name, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Item Deletion', message=message, affected_user=affected_user)
    log.save()

def requestItemCreation(request_item, initiating_user_pk, requestObj):
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = None
    request = requestObj
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} created by {}'.format(request_item.item.name, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, request=request, quantity=quantity, category='Request Item Creation', message=message, affected_user=affected_user)
    log.save()

def requestItemDenial(request_item, initiating_user_pk, requestObj):
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = request_item.request.requester
    request = requestObj
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} denied by {}'.format(request_item.item.name, initiating_user.username)
    log = models.Log(item=item, request=request, initiating_user=initiating_user, quantity=quantity, category='Request Item Denial', message=message, affected_user=affected_user)
    log.save()

def requestItemApproval(request_item, initiating_user_pk, requestObj):
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    print(request_item.request.requester)
    affected_user = request_item.request.requester
    request = requestObj
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} approved by {}'.format(request_item.item.name, initiating_user.username)
    log = models.Log(item=item, request=request, initiating_user=initiating_user, quantity=quantity, category='Request Item Approval', message=message, affected_user=affected_user)
    log.save()

def userCreationLog(data, initiating_user_pk):
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    try:
        affected_user = User.objects.get(username=data['username'])
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = "User {} was created by {}".format(affected_user, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='User Creation', message=message, affected_user=affected_user)
    log.save()

def transactionCreationLog(item, initiating_user_pk, category, amount):
    item = item
    initiating_user = None
    quantity = amount
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = "User {} created a {} transaction on item {} of quantity {} and it now has a quantity of {}".format(initiating_user, category, item, quantity, item.quantity)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Transaction Creation', message=message, affected_user=affected_user)
    log.save()
