from django.shortcuts import render
from rest_framework import generics
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
class ItemListView(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = serializers.ItemSerializer

    def get_queryset(self):
        search = self.request.query_params.get("search")
        tags = self.request.query_params.get("tags")
        q_objs = Q()
        if search is not None:
            q_objs |= Q(name__icontains=search) | Q(model__icontains=search)
        if tags is not None and tags != '':
        	#todo do we want OR or AND logic? right not it is OR
        	tagsArray = tags.split(",")
        	q_objs |= Q(tags__name__in=tagsArray)

        queryset = models.Item.objects.filter(q_objs).distinct()
        return queryset

class AuthView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, format=None):
        body = json.loads(request.body.decode('utf8'))
        username = body["username"]
        password = body["password"]
        thisuser = authenticate(username=username, password=password)

        if thisuser is not None:
            #Should only be one
            if Token.objects.filter(user=thisuser).count() == 1:
                #User has a token lets create a new one
                Token.objects.filter(user=thisuser).update(key=Token.generate_key(Token))
                return Response({"token": Token.objects.get(user=thisuser).key})
            else:
                #First time login, create new token for user
                token = Token.objects.create(user=thisuser)
                return Response({"token": token.key})

            # login(request, user) I DON'T THINK WE NEED TO USE THIS, ITS NORMAL DJANGO
            #MIGHT NEED FOR LOGGING USER SESSIONS
        else:
            return Response({"token" : "Failure"})

class RequestListView(generics.ListAPIView):
    serializer_class = serializers.RequestSerializer

    def get_queryset(self):
        filters = {}
        '''
        user = self.request.query_params.get("user")
        item = self.request.query_params.get("item")
        status = self.request.query_params.get("status")
        if user:
        	filters["user"] = user
        if item:
        	filters["item"] = item
        if status:
        	filters["status"] = status
        '''
        queryset = models.Request.objects.filter(**filters)

        return queryset


class TagListView(generics.ListAPIView):
    serializer_class = serializers.TagSerializer

    def get_queryset(self):
        queryset = models.Tag.objects.all()
        return queryset
