from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from . import views
from django.contrib.auth import views as auth_views


urlpatterns = [

    # ITEM ENDPOINTS
    url(r'^items/?$',                                                   views.ItemListCreate.as_view()),
    url(r'^items/(?P<item_name>[\w]*)/?$',                              views.ItemDetailModifyDelete.as_view()),
    url(r'^items/(?P<item_name>[\w]*)/addtocart/?$',                    views.ItemAddToCart.as_view()),
    url(r'^items/(?P<item_name>[\w]*)/fields/?$',                       views.CustomValueList.as_view()),
    url(r'^items/(?P<item_name>[\w]*)/fields/(?P<field_name>[\w]*)/?$', views.CustomValueDetailModify.as_view()),

    url(r'^fields/?$',                       views.CustomFieldListCreate.as_view()),
    url(r'^fields/(?P<field_name>[\w]*)/?$', views.CustomFieldDetailDelete.as_view()),

    url(r'^cart/?$',                       views.CartItemList.as_view()),
    url(r'^cart/?(?P<item_name>[\w]*)/?$', views.CartItemDetailModifyDelete.as_view()),

    # url(r'^requests/?$', views.RequestListCreate.as_view()),
    # url(r'^requests/(?P<pk>[0-9]*)/?$', views.RequestDetailModifyDelete.as_view()),

    url(r'^login/?$', views.post_user_login),
    url(r'^signup/?$', views.post_user_signup),
    url(r'^logout/?$', auth_views.logout),

    url(r'^currentuser/?$', views.get_current_user)

]

urlpatterns = format_suffix_patterns(urlpatterns)
