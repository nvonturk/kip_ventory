from django.conf.urls import url
from rest_framework.urlpatterns import format_suffix_patterns

from . import views
from django.contrib.auth import views as auth_views


urlpatterns = [
    url(r'^items/?$', views.ItemView.as_view()),
    url(r'^items/(?P<pk>[0-9]+)/?$', views.ItemView.as_view()),

    url(r'^requests/?$', views.request_get_create),
    url(r'^requests/(?P<pk>[0-9]+)/?$', views.request_modify_delete),
    url(r'^requests/all/?$', views.request_get_all_admin),

    url(r'^cart/?$', views.cart_get_create),
    url(r'^cart/(?P<pk>[0-9]+)/?$', views.cart_detail_modify_delete),

    url(r'^tags/?$', views.TagListView.as_view()),

    url(r'^login/?$', views.post_user_login),
    url(r'^signup/?$', views.post_user_signup),
    url(r'^logout/?$', auth_views.logout),

    url(r'^users/?$', views.get_all_users),
    url(r'^users/current/?$', views.get_current_user),
]

urlpatterns = format_suffix_patterns(urlpatterns)
