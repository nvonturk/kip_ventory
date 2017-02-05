from django.shortcuts import render
from rest_framework import generics, mixins
from rest_framework import status

# from rest_framework import pagination
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view

from django.db.models import Q
from django.http.request import QueryDict
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.shortcuts import redirect, render

from . import models, serializers


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

        # Search filter
        if search is not None and search!='':
            q_objs &= (Q(name__icontains=search) | Q(model__icontains=search))

        queryset = models.Item.objects.filter(q_objs).distinct()

        # Tags filter
        if tags is not None and tags != '':
            tagsArray = tags.split(",")
            for tag in tagsArray:
                queryset = queryset.filter(tags__name=tag)

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

        items = self.get_queryset()
        toReturn = []
        for item in items:
            serializer = serializers.ItemGETSerializer(item)
            itemToAdd = serializer.data
            requests = None
            if request.user.is_staff:
                requests = models.Request.objects.filter(item=item.id)
            else:
                requests = models.Request.objects.filter(item=item.id, requester=request.user.pk)

            if requests is not None:
                requestsToAdd = []
                for req in requests:
                    reqSerializer = serializers.ItemRequestGETSerializer(req)
                    requestsToAdd.append(reqSerializer.data)
                itemToAdd["request_set"] = requestsToAdd
            toReturn.append(itemToAdd)

        return Response(toReturn)

        #return self.list(request, args, kwargs)

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

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs.keys():
            return self.retrieve(request, args, kwargs)
        return self.list(request, args, kwargs) #this line throws an error

    def post(self, request, *args, **kwargs):
        return self.create(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)



@api_view(['POST'])
def login_view(request):
    username = request.POST['username']
    password = request.POST['password']
    user = authenticate(username=username, password=password)
    if user is not None:
        login(request, user)
        return redirect('/app/')
    else:
        # Return an 'invalid login' error message.
        from django.contrib import messages
        messages.add_message(request._request, messages.ERROR, 'invalid-login-credentials')
        return redirect('/')

class RequestResponseView(generics.GenericAPIView,
               mixins.ListModelMixin,
               mixins.RetrieveModelMixin,
               mixins.CreateModelMixin,
               mixins.DestroyModelMixin):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        ''' Only allow a user/admin to see his own RequestResponse items'''
        responsetype = self.request.query_params.get("responsetype")

        if self.request.user.is_staff:
            if responsetype is not None and responsetype!='':
                batch = models.RequestResponse.objects.all().filter(status=responsetype)
            else:
                batch =  models.RequestResponse.objects.all()
        else:
            if responsetype is not None and responsetype!='':
                batch = models.RequestResponse.objects.filter(requester__pk=self.request.user.pk, status=responsetype)
            else:
                batch = models.RequestResponse.objects.filter(requester__pk=self.request.user.pk)

        return batch



    def get_serializer_class(self):
        '''Use a smaller representation if we're POSTing'''
        if self.request.method == "POST":
            return serializers.RequestResponsePOSTSerializer
        return serializers.RequestResponseGETSerializer

    def get(self, request, *args, **kwargs):
        if 'pk' in kwargs.keys():
            return self.retrieve(request, args, kwargs)
        return self.list(request, args, kwargs)

    def post(self, request, *args, **kwargs):
        return self.create(request, args, kwargs)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)




class CurrentUserView(generics.GenericAPIView,
                      mixins.ListModelMixin):
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        ''' Only allow a user/admin to see his own cart items'''
        return User.objects.filter(pk=self.request.user.pk)

    def get_serializer_class(self):
        return serializers.UserGETSerializer

    def get(self, request, *args, **kwargs):
        return self.list(request, args, kwargs)


class SignupUserView(generics.GenericAPIView,
                 mixins.CreateModelMixin):
    permission_classes = (AllowAny,)

    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        return serializers.UserPOSTSerializer

    def post(self, request, *args, **kwargs):
        username = request.data['username']
        password = request.data['password']
        first_name = request.data['first_name']
        last_name = request.data['last_name']
        email = request.data['email']
        user = User.objects.create_user(
                                username=username,
                                email=email,
                                password=password,
                                first_name=first_name,
                                last_name=last_name)
        return redirect('/login/')


class TagListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = serializers.TagSerializer

    def get_queryset(self):
        queryset = models.Tag.objects.all()
        return queryset
