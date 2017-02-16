from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from . import views
from django.contrib.auth import views as auth_views


urlpatterns = [

    # ITEM ENDPOINTS
    url(r'^items/?$',                       views.ItemListCreate.as_view()),
    url(r'^items/(?P<pk>[0-9]*)/?$',        views.ItemDetailModifyDelete.as_view()),

    url(r'^items/(?P<ipk>[0-9]*)/fields/?$', views.CustomFieldListCreate.as_view()),
    url(r'^items/(?P<ipk>[0-9]*)/fields/(?P<fpk>[0-9]*)/?$', views.CustomFieldDetailModifyDelete.as_view()),

    url(r'^cart/?$', views.CartItemListCreate.as_view()),
    url(r'^cart/?(?P<pk>[0-9]*)/?$', views.CartItemDetailModifyDelete.as_view()),
    #
    # url(r'^requests/?$', views.RequestListCreate.as_view()),
    # url(r'^requests/(?P<pk>[0-9]*)/?$', views.RequestDetailModifyDelete.as_view()),

    url(r'^login/?$', views.post_user_login),
    url(r'^signup/?$', views.post_user_signup),
    url(r'^logout/?$', auth_views.logout),

]

urlpatterns = format_suffix_patterns(urlpatterns)
