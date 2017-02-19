"""kipventory URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.10/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url, include
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.views import static
from . import views
from rest_framework_swagger.views import get_swagger_view


schema_view = get_swagger_view(title='Pastebin API')

urlpatterns = [
    # admin site for quick dev testing
    url(r'^admin/?', admin.site.urls),

    # URLs for our REST API endpoints
    url(r'^api/', include('api.urls')),

    # Swagger Docs for API testing
    url(r'^swagger/', schema_view),

    # Main view for our Single Page App (React, client side)
    url(r'^app/?', views.app, name='app'),

url(r'^media/(?P<path>.*)$', static.serve, {
    'document_root': settings.MEDIA_ROOT,
}),
url(r'^static/(?P<path>.*)$', static.serve, {
    'document_root': settings.STATIC_ROOT,
}),

    # Landing page (no auth necessary)
    url(r'$', views.landing, name='landing'),
]
