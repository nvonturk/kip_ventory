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
        return get_my_paginated_response(self.page.paginator.count, self.page.paginator.num_pages, data)

def get_my_paginated_response(count, num_pages, data):
    return Response({
        "count" : count,
        "num_pages" : num_pages,
        "results" : data
    })

def paginateRequest(request, queryset, defaultItemsPerPage, serializer):
    itemsPerPage = request.GET.get('itemsPerPage')
    if itemsPerPage is None:
        itemsPerPage = defaultItemsPerPage
    page = request.GET.get('page')
    if page is None:
        page = 1

    return paginate(queryset, itemsPerPage, page, serializer)

def paginate(queryset, itemsPerPage, page, serializer):
    paginator = Paginator(queryset, itemsPerPage)
    try:
        queryset = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        queryset = paginator.page(1)
    except EmptyPage:
        # If page is out of range (e.g. 9999), deliver last page of results.
        queryset = paginator.page(paginator.num_pages)

    data = serializer(instance=queryset, many=True).data
    '''
    toReturn = {
        "count" : paginator.count,
        "num_pages" : paginator.num_pages,
        "results" : data
    }
    '''
    return get_my_paginated_response(paginator.count, paginator.num_pages, data)

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
        serializer = self.get_serializer(instance=item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # manager restricted
    def delete(self, request, item_name, format=None):
        if not (request.user.is_superuser):
            d = {"error": "Administrator permissions required."}
            return Response(d, status=status.HTTP_403_FORBIDDEN)

        item = self.get_instance(item_name=item_name)
        item.delete()
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

        request.data.update({'owner': request.user})
        request.data.update({'item': item})

        cartitems = self.get_queryset().filter(item__name=item_name)
        if cartitems.count() > 0:
            serializer = self.get_serializer(instance=cartitems.first(), data=request.data)
        else:
            serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            cart_quantity      = int(request.data['quantity'])
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
        if not (request.user.is_staff or request.user.is_superuser):
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
            raise NotFound('Cart item {} not found.'.format(pk))

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

        request.data.update({'owner': request.user})
        request.data.update({'item': cartitem.item})

        serializer = self.get_serializer(instance=cartitem, data=request.data, partial=True)
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

@api_view(['GET'])
@permission_classes((permissions.IsAuthenticated,))
def item_requests_get(request, item_name, format=None):
    if request.method == 'GET':
        requests = None
        if request.user.is_staff:
            requests = models.Request.objects.filter(item__name=item_name)
        else:
            requests = models.Request.objects.filter(item__name=item_name, requester=request.user.pk)
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
            req_item.save()
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

@api_view(['POST'])
@permission_classes((permissions.AllowAny,))
def post_user_signup(request, format=None):
    username = request.data['username']
    first_name = request.data['first_name']
    last_name = request.data['last_name']
    email = request.data['email']

    # Make sure username is unique
    # Todo: make email unique?
    exists = (User.objects.filter(username=username).count() > 0)
    if exists:
        messages.add_message(request._request, messages.ERROR, "username-taken")
        return redirect('/')

    models.NewUserRequest.objects.create(
                            username=username,
                            email=email,
                            first_name=first_name,
                            last_name=last_name)
    messages.add_message(request._request, messages.SUCCESS, "user-created")
    return redirect('/')

class CurrentUser(generics.GenericAPIView):
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

class NetIDToken(generics.GenericAPIView):
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

@api_view(['GET'])
@permission_classes((permissions.IsAuthenticated,))
def get_new_user_requests(request):
    if not (request.user.is_staff or request.user.is_superuser):
        d = {"error": "Permission denied."}
        return Response(d, status=status.HTTP_403_FORBIDDEN)

    queryset = models.NewUserRequest.objects.all()
    serializer = serializers.NewUserRequestSerializer(queryset, many=True)
    return Response(serializer.data)

# manager restricted
@api_view(['GET'])
@permission_classes((permissions.IsAuthenticated,))
def get_new_user_request(request, username):
    if not (request.user.is_staff or request.user.is_superuser):
        d = {"error": "Permission denied."}
        return Response(d, status=status.HTTP_403_FORBIDDEN)

    queryset = models.NewUserRequest.objects.get(username=username)
    serializer = serializers.NewUserRequestSerializer(queryset)
    return Response(serializer.data)

# manager restricted
@api_view(['POST'])
@permission_classes((permissions.IsAuthenticated,))
def approve_new_user_request(request, username):
    if not (request.user.is_staff or request.user.is_superuser):
        d = {"error": "Permission denied."}
        return Response(d, status=status.HTTP_403_FORBIDDEN)

    # Retrieve user request
    user_request = models.NewUserRequest.objects.get(username=username)
    email = user_request.email
    first_name = user_request.first_name
    last_name = user_request.last_name

    # Make sure username and email are unique
    username_taken = User.objects.filter(username=username).count() > 0
    email_taken = User.objects.filter(email=email).count() > 0
    if username_taken:
        return Response({"error":"Username already taken."})
    if email_taken:
        return Response({"error":"Email already taken."})

    # Create new user with random password
    password = get_random_string()
    user = User.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)

    # Send email to confirm account and reset password (note: it sends email to all users with this email. so we should make email unique)
    reset_form = PasswordResetForm({'email': email})
    if reset_form.is_valid():
        reset_form.save(request=request)
    else:
        return Response({"error":"Unable to send email to new user."})

    # Delete the user request
    #todo: log this
    models.NewUserRequest.objects.get(username=username).delete()

    return Response({"success":"true"})

# manager restricted
@api_view(['POST'])
@permission_classes((permissions.IsAuthenticated,))
def deny_new_user_request(request, username):
    if not (request.user.is_staff or request.user.is_superuser):
        d = {"error": "Permission denied."}
        return Response(d, status=status.HTTP_403_FORBIDDEN)

    # Todo: send denial email
    # Todo: log it
    models.NewUserRequest.objects.get(username=username).delete()

    return Response({"success":"true"})

@api_view(['GET'])
@permission_classes((permissions.IsAuthenticated,))
def get_all_users(request, format=None):
    if not request.user.is_staff:
        return Response(status=status.HTTP_403_FORBIDDEN)
    # todo add pagination? use react-select asynchronous search
    users = User.objects.all()
    serializer = serializers.UserGETSerializer(users, many=True)
    return Response(serializer.data)

class TagListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = serializers.TagSerializer

    def get_queryset(self):
        #todo add pagination? use react-select asynchronous search
        queryset = models.Tag.objects.all()
        return queryset

@api_view(['GET', 'POST'])
@permission_classes((permissions.IsAuthenticated,))
def transaction_get_create(request, format=None):
    if request.method == 'GET':
        queryset = None
        category = request.GET.get('category')
        if category is None or category=="All":
            queryset = models.Transaction.objects.all()
        else:
            queryset = models.Transaction.objects.filter(category=category)
        serializer = serializers.TransactionGETSerializer
        defaultItemsPerPage = 3
        return paginateRequest(request, queryset, defaultItemsPerPage, serializer)

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
