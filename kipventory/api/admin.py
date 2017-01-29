from django.contrib import admin

from .models import Item, Category, Tag, User

# Register your models here.
admin.site.register(Item)
admin.site.register(Category)
admin.site.register(User)
admin.site.register(Tag)
