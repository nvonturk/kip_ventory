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
from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from . import views
# from rest_framework.authtoken import views as authviews


urlpatterns = [
    url(r'^items/?$', views.ItemListView.as_view()),
    url(r'^requests/?$', views.RequestListView.as_view()),
    url(r'^cart/?$', views.CartItemListView.as_view()),
    url(r'^auth/?$', views.AuthView.as_view()),
    url(r'^tags/$', views.TagListView.as_view()),
    url(r'^addtocart/$', views.AddToCartView.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
