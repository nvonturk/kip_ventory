from django.shortcuts import render
from rest_framework import generics
from rest_framework import status
from rest_framework.response import Response

from . import models, serializers

from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login

from rest_framework.authtoken.models import Token

from django.shortcuts import redirect



# Create your views here.
class ItemListView(generics.ListAPIView):
    serializer_class = serializers.ItemSerializer

    def get_queryset(self):
        queryset = models.Item.objects.all()
        return queryset


# Create your views here.
class RequestListView(generics.ListAPIView):
    serializer_class = serializers.RequestSerializer

    def get_queryset(self):
        queryset = models.Request.objects.all()
        return queryset



class AuthView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, format=None):
        username = request.query_params["username"]
        password = request.query_params["password"]
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
