from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=100)
    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

class Item(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    location    = models.CharField(max_length=100)
    model_no    = models.CharField(max_length=100)
    quantity    = models.IntegerField(default=0)
    description = models.TextField(max_length=500)
    tags        = models.ManyToManyField(Tag)

    class Meta:
        ordering = ('model_no',)

    def __str__(self):
        return self.name

class KUser(User):

    class Meta:
        proxy       = True
        ordering    = ('last_name',)

    def __str__(self):
        return self.username

class Request(models.Model):
    kuser               = models.ForeignKey(KUser, null=True)
    items               = models.ManyToManyField(Item)
    date_filed          = models.DateTimeField(default=timezone.now, editable=False)
    description         = models.TextField(max_length=500)
    ### Status Choices ###
    WAITING             = 'Waiting'
    APPROVED            = 'Approved'
    COMPLETE            = 'Complete'
    status_choices      = (
        (WAITING  , 'Waiting'), 
        (APPROVED , 'Approved'), 
        (COMPLETE , 'Complete'),
    )

    status              = models.CharField(
        max_length = 10,
        choices = status_choices,
        default = WAITING,
        )
    ######

