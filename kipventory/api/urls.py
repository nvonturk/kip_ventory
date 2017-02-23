from django.conf.urls import url, include
from rest_framework.urlpatterns import format_suffix_patterns

from . import views
from django.contrib.auth import views as auth_views


urlpatterns = [

    # ITEM ENDPOINTS
    url(r'^items/?$',                                                     views.ItemListCreate.as_view()),
    url(r'^items/(?P<item_name>[\w\s]+)/?$',                              views.ItemDetailModifyDelete.as_view()),
    url(r'^items/(?P<item_name>[\w\s]+)/addtocart/?$',                    views.AddItemToCart.as_view()),
    url(r'^items/(?P<item_name>[\w\s]+)/fields/?$',                       views.CustomValueList.as_view()),
    url(r'^items/(?P<item_name>[\w\s]+)/fields/(?P<field_name>[\w\s]*)/?$', views.CustomValueDetailModify.as_view()),
    url(r'^items/(?P<item_name>[\w\s]+)/requests/?$',                     views.GetOutstandingRequestsByItem.as_view()),

    url(r'^tags/?$', views.TagListCreate.as_view()),

    url(r'^fields/?$',                       views.CustomFieldListCreate.as_view()),
    url(r'^fields/(?P<field_name>[\w]+)/?$', views.CustomFieldDetailDelete.as_view()),

    url(r'^cart/?$',                       views.CartItemList.as_view()),
    url(r'^cart/?(?P<item_name>[\w]+)/?$', views.CartItemDetailModifyDelete.as_view()),

    url(r'^transactions/?$', views.TransactionListCreate.as_view()),

    url(r'^requests/?$',                        views.RequestListCreate.as_view()),
    url(r'^requests/all/?$',                    views.RequestListAll.as_view()),
    url(r'^requests/(?P<request_pk>[0-9]*)/?$', views.RequestDetailModifyDelete.as_view()),

    url(r'^login/?$',  views.post_user_login),
    url(r'^logout/?$', auth_views.logout),

    url(r'^logs/?$', views.LogList.as_view()),

    url(r'^users/?$',         views.UserListCreate.as_view()),
    url(r'^users/current/?$', views.GetCurrentUser.as_view()),

    url(r'^netidtoken/?$',    views.GetNetIDToken.as_view()),
]

urlpatterns = format_suffix_patterns(urlpatterns)
