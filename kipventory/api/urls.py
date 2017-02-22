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
    url(r'^items/(?P<item_name>[\w\s]+)/fields/(?P<field_name>[\w]*)/?$', views.CustomValueDetailModify.as_view()),
    url(r'^items/(?P<item_name>[\w\s]+)/requests/$',                      views.item_requests_get),

    url(r'^tags/?$', views.TagListView.as_view()),

    url(r'^fields/?$',                       views.CustomFieldListCreate.as_view()),
    url(r'^fields/(?P<field_name>[\w\s]+)/?$', views.CustomFieldDetailDelete.as_view()),

    url(r'^cart/?$',                       views.CartItemList.as_view()),
    url(r'^cart/?(?P<item_name>[\w\s]+)/?$', views.CartItemDetailModifyDelete.as_view()),

    url(r'^transactions/?$', views.transaction_get_create),

    url(r'^requests/?$',                        views.RequestListCreate.as_view()),
    url(r'^requests/all/?$',                    views.RequestListAll.as_view()),
    url(r'^requests/(?P<request_pk>[0-9]*)/?$', views.RequestDetailModifyDelete.as_view()),

    url(r'^login/?$',  views.post_user_login),
    url(r'^signup/?$', views.post_user_signup),
    url(r'^logout/?$', auth_views.logout),

    url(r'^users/?$',         views.get_all_users),
    url(r'^users/current/?$', views.CurrentUser.as_view()),
    url(r'^netidtoken/?$',    views.NetIDToken.as_view()),

    url(r'^newuserrequests/?$',                             views.get_new_user_requests),
    url(r'^newuserrequests/(?P<username>[\w\s]+)/?$',         views.get_new_user_request),
    url(r'^newuserrequests/(?P<username>[\w\s]+)/approve/?$', views.approve_new_user_request),
    url(r'^newuserrequests/(?P<username>[\w\s]+)/deny/?$',    views.deny_new_user_request),

    url('^', include('django.contrib.auth.urls')),
]

urlpatterns = format_suffix_patterns(urlpatterns)
