from django.shortcuts import render
from rest_framework import generics
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
    # authentication_classes = (TokenAuthentication) #FOR TESTING
    # permission_classes = (IsAuthenticated,) #FOR TESTING
    serializer_class = serializers.ItemSerializer

    def get_queryset(self):
        # content = {
        #     'user': unicode(request.user),  # `django.contrib.auth.User` instance.
        #     'auth': unicode(request.auth),  # None
        # }
        # return Response({"token" : "hey"})
        queryset = models.Item.objects.all()
        return queryset


class ExampleView(APIView):
    # authentication_classes = (TokenAuthentication) #FOR TESTING
    permission_classes = (AllowAny,) #FOR TESTING

    def get(self, request, format=None):
        # potentialuser = request
        username = request.query_params["username"]
        password = request.query_params["password"]
        thisuser = authenticate(username=username, password=password)


        if thisuser is not None:
            #Should only be one

            if Token.objects.filter(user=thisuser).count() == 1:
                #User has a token lets create a new one

                Token.objects.filter(user=thisuser).update(key=Token.generate_key(Token))
                return Response({"token": Token.objects.get(user=thisuser).key})
                ...
            else:
                token = Token.objects.create(user=thisuser)
                return Response({"token": token})
                ...

            # login(request, user) I DON'T THINK WE NEED TO USE THIS, ITS NORMAL DJANGO
            #redirect and send token
            ...
        else:
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
        token2 = Token.objects.values_list('key', flat=True).get(pk=1)
        return Response({"message": token2})
