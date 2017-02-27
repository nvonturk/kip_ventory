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

import requests


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

    def get(self, request, format=None):
        # CHECK PERMISSION
        queryset = self.get_queryset()

        # Search and Tag Filtering
        search = self.request.query_params.get("search")
        tags = self.request.query_params.get("tags")
        excludeTags = self.request.query_params.get("excludeTags")
        q_objs = Q()

        # Search filter
        if search is not None and search!='':
            q_objs &= (Q(name__icontains=search) | Q(model_no__icontains=search))

        queryset = models.Item.objects.filter(q_objs).distinct()

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
            # Insert Create Log
            # Need {serializer.data, initiating_user_pk, 'Item Creation'}
            print("About to Create a Log")
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

        item = self.get_instance(item_name=item_name)

        # check if we're trying to modify quantity
        quantity = int(request.data.get('quantity', None))
        if not (quantity is None):
            if (quantity != item.quantity):
                if not (request.user.is_superuser):
                    return Response({"error": "Admin permissions required."})

        serializer = self.get_serializer(instance=item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Insert Create Log
            # Need {serializer.data, initiating_user_pk, 'Item Changed'}
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
            cart_quantity      = int(data['quantity'])
            if (cart_quantity <= 0):
                return Response({"quantity": "Quantity must be a positive integer."})
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
            cart_quantity = int(request.data['quantity'])
            if (cart_quantity < 0):
                return Response({"quantity": "Quantity must be a positive integer."})
            elif cart_quantity == 0:
                cartitem.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
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

    def get_queryset(self):
        return models.Request.objects.all()

    def get_serializer_class(self):
        return serializers.RequestSerializer

    def get(self, request, item_name, format=None):
        requests = self.get_queryset()
        if request.user.is_staff or request.user.is_superuser:
            requests = models.Request.objects.filter(request_items__item__name=item_name)
        else:
            requests = models.Request.objects.filter(request_items__item__name=item_name, requester=request.user.pk)
        serializer = serializers.RequestSerializer(requests, many=True)
        return Response(serializer.data)


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
        paginated_queryset = self.paginate_queryset(queryset)
        serializer = self.get_serializer(instance=paginated_queryset, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

    # generate a request that contains all items currently in your cart.
    def post(self, request, format=None):
        request.data.update({'requester': request.user})

        cart_items = models.CartItem.objects.filter(owner__pk=self.request.user.pk)
        if cart_items.count() <= 0:
            d = {"error": "There are no items in your cart. Add an item to request it."}
            return Response(d, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            request_instance = serializer.save()

        for ci in cart_items:
            item = ci.item
            quantity = ci.quantity
            req_item = models.RequestItem.objects.create(item=item, quantity=quantity, request=request_instance)
            # Insert Create Log
            # Need {serializer.data, initiating_user_pk, 'Request Created'}
            req_item.save()
            requestItemCreation(req_item, request.user.pk)
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

        request.data.update({'administrator': request.user})
        instance = self.get_instance(request_pk)
        serializer = self.get_serializer(instance=instance, data=request.data, partial=True)

        if serializer.is_valid():
            # check integrity of approval operation
            if request.data['status'] == 'D':
                # Insert Create Log
                # Need {serializer.data, initiating_user_pk, 'Request Approved'}
                for ri in instance.request_items.all():
                    requestItemDenial(ri, request.user.pk)
            if request.data['status'] == 'A':
                valid_request = True
                new_quantities = {}
                for ri in instance.request_items.all():
                    item = ri.item
                    available_quantity = item.quantity
                    requested_quantity = ri.quantity
                    if (requested_quantity > available_quantity):
                        valid_request = False
                        break
                # decrement quantity available on each item in the approved request
                if valid_request:
                    for ri in instance.request_items.all():
                        item = ri.item
                        available_quantity = item.quantity
                        requested_quantity = ri.quantity
                        item.quantity = (available_quantity - requested_quantity)
                        item.save()
                        # Insert Create Log
                        # Need {serializer.data, initiating_user_pk, 'Request Approved'}
                        requestItemApproval(ri, request.user.pk)
                else:
                    return Response({"error": "Cannot satisfy request."}, status=status.HTTP_400_BAD_REQUEST)
            serializer.save()
            # item = models.Item.objects.get(pk=request.data['item'])
            # item.quantity = item.quantity - int(request.data['quantity'])
            # item.save()
            # createLog(request.data, request.data['administrator'], 'Request')
            print(request.data)
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

@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def post_user_login(request, format=None):
    username = request.POST['username']
    password = request.POST['password']

    user = authenticate(username=username, password=password)

    if hasattr(user, 'kipventory_user'):
        if user.kipventory_user.is_duke_user:
            messages.add_message(request._request, messages.ERROR, 'login-via-duke-authentication')
            return redirect('/')

    if user is not None:
        login(request, user)
        return redirect('/app/')
    else:
        # Return an 'invalid login' error message.
        messages.add_message(request._request, messages.ERROR, 'invalid-login-credentials')
        return redirect('/')


class UserListCreate(generics.GenericAPIView):
    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        return serializers.UserSerializer

    def get(self, request, format=None):
        users = self.get_queryset()
        serializer = self.get_serializer(instance=users, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
            "is_staff": user.is_staff,
            "email": user.email,
            "is_superuser": user.is_superuser
        })

class GetNetIDToken(generics.GenericAPIView):
    queryset = None
    permission_classes = (permissions.AllowAny,)
    serializer_class = None

    def get(self, request, format=None):
        code = request.query_params.get('code')

        p = {'grant_type' : 'authorization_code', 'code' : code, 'redirect_uri' : 'http://127.0.0.1:8000/api/netidtoken/', 'client_id' : 'kipventory', 'client_secret' : '#4ay9FQFuAPQbv8urcj+R%kd@YtAY4@=ggUXWbuvxjMX2g3kWo'}

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

    def get_queryset(self):
        return models.Tag.objects.all()

    def get(self, request, format=None):
        tags = self.get_queryset()

        paginated_tags = self.paginate_queryset(tags)
        serializer = self.get_serializer(instance=paginated_tags, many=True)
        response = self.get_paginated_response(serializer.data)
        return response

    def post(self, request, format=None):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogList(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

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
        serializer = self.get_serializer(instance=logs, many=True)
        return Response(serializer.data)



class TransactionListCreate(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return models.Transaction.objects.all()

    def get_serializer_class(self):
        return serializers.TransactionSerializer

    def get(self, request, format=None):
        queryset = self.get_queryset()
        category = request.GET.get('category')
        if not (category is None or category=="All"):
            queryset = models.Transaction.objects.filter(category=category)

        serializer = self.get_serializer(instance=queryset, many=True)
        return Response(serializer.data)

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

def itemCreationLog(data, initiating_user_pk):
    print("Item Creation")
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
    print("Item Modification")
    item = None
    initiating_user = None
    quantity = None
    affected_user = None
    print(data)
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
    print("Item Deletion")
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

def requestItemCreation(request_item, initiating_user_pk):
    print("Request Item Creation")
    print(request_item)
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = None
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} created by {}'.format(request_item.item.name, initiating_user)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Request Item Creation', message=message, affected_user=affected_user)
    log.save()

def requestItemDenial(request_item, initiating_user_pk):
    print("Request Item Denial")
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    affected_user = request_item.request.requester
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} denied by {}'.format(request_item.item.name, initiating_user.username)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Request Item Denial', message=message, affected_user=affected_user)
    log.save()

def requestItemApproval(request_item, initiating_user_pk):
    print("Request Item Approval")
    item = request_item.item
    initiating_user = None
    quantity = request_item.quantity
    print(request_item.request.requester)
    affected_user = request_item.request.requester
    try:
        initiating_user = User.objects.get(pk=initiating_user_pk)
    except User.DoesNotExist:
        raise NotFound('User not found.')
    message = 'Request Item for item {} approved by {}'.format(request_item.item.name, initiating_user.username)
    log = models.Log(item=item, initiating_user=initiating_user, quantity=quantity, category='Request Item Approval', message=message, affected_user=affected_user)
    log.save()

def userCreationLog(data, initiating_user_pk):
    print("User Creation")
    print(data)
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
    print("Transaction Creation")
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
