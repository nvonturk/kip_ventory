from django.contrib import admin
from .models import Item, Tag, KUser, Request

# Register your models here.
admin.site.register(Item)
admin.site.register(KUser)
admin.site.register(Tag)
admin.site.register(Request)
