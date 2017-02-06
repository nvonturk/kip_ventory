from django.shortcuts import render
from rest_framework import generics, mixins
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes

from django.db.models import Q
from django.http.request import QueryDict
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger

from . import models, serializers
from rest_framework import pagination

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
        excludeTags = self.request.query_params.get("excludeTags")
        q_objs = Q()

        # Search filter
        if search is not None and search!='':
            q_objs &= (Q(name__icontains=search) | Q(model__icontains=search))

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

        # how to filter to only include some requests?
        #queryset.request_set.filter(status="O") #not correct

        return queryset


    def get_serializer_class(self):
        if self.request.method == "POST":
            return serializers.ItemPOSTSerializer
        return serializers.ItemGETSerializer

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs.keys():
            return self.retrieve(request, args, kwargs)

        # Pagination: rest framework does it for you, but request stuff below messes it up so i'm doing it manually
        
        queryset = self.get_queryset()
        itemsPerPage = self.request.GET.get('itemsPerPage')
        if itemsPerPage is None:
            itemsPerPage = 3
        paginator = Paginator(queryset, itemsPerPage)
        page = self.request.GET.get('page')
        try:
            queryset = paginator.page(page)
        except PageNotAnInteger:
            # If page is not an integer, deliver first page.
            queryset = paginator.page(1)
        except EmptyPage:
            # If page is out of range (e.g. 9999), deliver last page of results.
            queryset = paginator.page(paginator.num_pages)
        
        
        
        # Attach requests
        items = queryset
        
        #items = self.get_queryset()
        toReturn = {
            "count" : paginator.count,
            "num_pages" : paginator.num_pages,
            "results" : []
        }
        itemsToReturn = []
        for item in items:
            serializer = serializers.ItemGETSerializer(item)
            itemToAdd = serializer.data
            requests = None
            if request.user.is_staff:
                requests = models.Request.objects.filter(item=item.id, status="O")
            else:
                requests = models.Request.objects.filter(item=item.id, status="O", requester=request.user.pk)

            if requests is not None:
                requestsToAdd = []
                for req in requests:
                    reqSerializer = serializers.ItemRequestGETSerializer(req)
                    requestsToAdd.append(reqSerializer.data)
                itemToAdd["request_set"] = requestsToAdd
            itemsToReturn.append(itemToAdd)

        toReturn["results"] = itemsToReturn
        return Response(toReturn)

    def post(self, request, *args, **kwargs):
        if not self.request.user.is_staff:
            content = {'error': "you're not authorized to modify items."}
            return Response(content, status=status.HTTP_403_FORBIDDEN)
        return self.create(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        if not self.request.user.is_staff:
            content = {'error': "you're not authorized to modify items."}
            return Response(content, status=status.HTTP_403_FORBIDDEN)
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
        """
        Check if there is already a CartItem with this item and owner.
        If so, update the quantity on that CartItem instead of creating a new one.
        """
        queryset = self.get_queryset().filter(item__pk=request.data['item'])
        flag = (queryset.count() > 0)
        if flag:
            self.kwargs['pk'] = queryset.first().pk
            return self.update(request, args, self.kwargs)
        return self.create(request, args, kwargs)

    def put(self, request, *args, **kwargs):
        return self.update(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)




class RequestView(generics.GenericAPIView,
                  mixins.ListModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.CreateModelMixin,
                  mixins.DestroyModelMixin):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        ''' Only allow a user/admin to see his own cart items'''
        if self.request.user.is_staff:
            return models.Request.objects.all()
        return models.Request.objects.filter(requester__pk=self.request.user.pk)

    def get_serializer_class(self):
        '''Use a smaller representation if we're POSTing'''
        if self.request.method == "POST":
            return serializers.RequestPOSTSerializer
        return serializers.RequestGETSerializer

@api_view(['GET', 'POST'])
@permission_classes((IsAuthenticated,))
def cart_get_create(request, format=None):
    if request.method == 'GET':
        cartitems = models.CartItem.objects.filter(owner__pk=request.user.pk)
        serializer = serializers.CartItemGETSerializer(cartitems, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # do we already have any of these items in our cart?
        queryset = models.CartItem.objects.filter(item__pk=request.data['item'])
        # if we do, update that item
        if queryset.count() == 1:
            cartitem = queryset.first()
            serializer = serializers.CartItemPOSTSerializer(cartitem, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # if we don't yet have this item in our cart, create a new one
        else:
            serializer = serializers.CartItemPOSTSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes((IsAuthenticated,))
def cart_detail_modify_delete(request, pk, format=None):
    try:
        # get this cart item
        cartitem = models.CartItem.objects.get(pk=pk)
        # verify that the user owns that cart item
        if (cartitem.owner.pk != request.user.pk):
            return Response(status=status.HTTP_403_FORBIDDEN)
    except models.CartItem.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = serializers.CartItemGETSerializer(cartitem)
        return Response(serializer.data)

    if request.method == 'PUT':
        serializer = serializers.CartItemPOSTSerializer(cartitem, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        cartitem.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes((IsAuthenticated,))
def request_get_all_admin(request, format=None):
    if request.method == 'GET':
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        requests = models.Request.objects.all()
        serializer = serializers.RequestGETSerializer(requests, many=True)
        return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes((IsAuthenticated,))
def request_get_create(request, format=None):
    print(request.query_params)
    if request.method == 'GET':
        # get your own requests
        requests = models.Request.objects.filter(requester__pk=request.user.pk)
        serializer = serializers.RequestGETSerializer(requests, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = serializers.RequestPOSTSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes((IsAuthenticated,))
def request_modify_delete(request, pk, format=None):
    try:
        request_obj = models.Request.objects.get(pk=pk)
    except models.Request.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    # if admin, see any request.
    # if user, only see your requests
    if request.method == 'GET':
        is_owner = (request.user.pk == request_obj.pk)
        if is_owner or request.user.is_staff:
            serializer = serializers.RequestGETSerializer(request_obj)
            return Response(serializer.data)
        return Response(status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        # only admins can modify requests (in order to change status)
        if not request.user.is_staff:# or (request.status != 'O'):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = serializers.RequestPOSTSerializer(request_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        # only allow request owners to delete requests
        is_owner = (request_obj.pk == request.user.pk)
        if not is_owner and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        request_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



@api_view(['POST'])
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
@permission_classes((AllowAny,))
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


@api_view(['GET'])
@permission_classes((IsAuthenticated,))
def get_current_user(request, format=None):
    user = User.objects.get(pk=request.user.pk)
    serializer = serializers.UserGETSerializer(user)
    return Response(serializer.data)


class TagListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = serializers.TagSerializer

    def get_queryset(self):
        queryset = models.Tag.objects.all()
        return queryset
