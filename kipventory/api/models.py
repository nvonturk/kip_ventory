from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)
    class Meta:
        ordering=('name',)

    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=100)
    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

class Item(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    location    = models.CharField(max_length=100)
    model_no     = models.CharField(max_length=100, unique=None)
    quantity    = models.IntegerField(default=0)
    description = models.TextField(max_length=500)
    tags        = models.ManyToManyField(Tag)

    class Meta:
        ordering = ('model_no',)

    def __str__(self):
        return self.name

class User(User):

    class Meta:
        proxy       = True
        ordering    = ('last_name',)

    def __str__(self):

        if self.last_name != "" and self.first_name != "":
            return self.last_name + ', ' + self.first_name
        else:
            return "None"
