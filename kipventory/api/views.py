from django.shortcuts import render
from rest_framework import generics
from rest_framework.response import Response

from . import models, serializers

from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login


# Create your views here.
class ItemListView(generics.ListAPIView):
    serializer_class = serializers.ItemSerializer

    def get_queryset(self):
        queryset = models.Item.objects.all()
        return queryset


class ExampleView(APIView):
    # authentication_classes = (SessionAuthentication, BasicAuthentication)
    # permission_classes = (IsAuthenticated,)

    def get(self, request, format=None):
        # potentialuser = request
        username = request.query_params["username"]
        password = request.query_params["password"]
        user = authenticate(username=username, password=password)
        if user is not None:
            # login(request, user)
            #redirect and send token
            ...
        else
            #redirect to login failure
            ...



        # user = authenticate(username=username, password=password)
        # if user is not None:
        #
        #     login(request, user)
        #     return Response({"message": "Hello, world!"})
        #     # Redirect to a success page.
        #     ...
        # else:
        #     # Return an 'invalid login' error message.
        #     ...
        return Response({"message": user.username})
