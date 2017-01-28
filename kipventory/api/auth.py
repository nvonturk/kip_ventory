from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework.authtoken.models import Token

from django.contrib.auth import authenticate, login



class ExampleView(APIView):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = (IsAuthenticated,)

    def get(self, request, format=None):
        print("request")
        content = {
            'user': unicode(request.user),  # `django.contrib.auth.User` instance.
            'auth': unicode(request.auth),  # None
        }
        return Response(content)

    # def get(self, request, format=None):
    #     # username = request.POST['username']
    #     # password = request.POST['password']
    #     print("did i hit this")
    #     content = {
    #         'username': unicode(request.username),  # `django.contrib.auth.User` instance.
    #         'password': unicode(request.password),  # None
    #     }
    #     user = authenticate(username=username, password=password)
    #     if user is not None:
    #         login(request, user)
    #         # Redirect to a success page.
    #         ...
    #     else:
    #         # Return an 'invalid login' error message.
    #         ...


#
# token = Token.objects.create(user=...)
# print token.key
