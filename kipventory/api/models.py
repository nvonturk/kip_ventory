from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

FIELD_TYPES = (
    ('s', 'Single-line text'),
    ('m', 'Multi-line text'),
    ('i', 'Integer'),
    ('f', 'Float'),
)

FIELD_TYPE_DICT = {
    's': str,
    'm': str,
    'i': int,
    'f': float
}

OUTSTANDING = 'O'
APPROVED = 'A'
DENIED = 'D'
### Status Choices ###
STATUS_CHOICES = (
    (OUTSTANDING, 'Outstanding'),
    (APPROVED, 'Approved'),
    (DENIED, 'Denied'),
)

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# class KipventoryUser(models.Model):
#     auth_user = models.OneToOneField(User, related_name='kipventory_user', on_delete=models.CASCADE)
#     # netid = models.CharField(default='', max_length=100, blank=True)
#     is_duke_user = models.BooleanField(default=False, blank=True)
#
#     def save(self, *args, **kwargs):
#
#         is_creation = False
#         if not self.pk:
#             is_creation = True
#
#         if 'username' in kwargs.keys():
#             username = kwargs.pop('username')
#             email = kwargs.pop('email')
#             first_name = kwargs.pop('first_name')
#             last_name = kwargs.pop('last_name')
#
#         if is_creation:
#             auth_user = User.objects.create_user(username=username, email=email, password=None, first_name=first_name, last_name=last_name)
#             self.auth_user = auth_user
#
#         super(KipventoryUser, self).save(*args, **kwargs)
#
#     def __str__(self):
#         return self.auth_user.username

class NewUserRequest(models.Model):
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    email = models.CharField(max_length=150, unique=True)
    comment = models.CharField(max_length=300, blank=True)

class Item(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    quantity    = models.PositiveIntegerField(default=0)
    model_no    = models.CharField(default='', max_length=100, blank=True)
    description = models.TextField(default='', max_length=500, blank=True)
    tags        = models.ManyToManyField(Tag, blank=True)

    def save(self, *args, **kwargs):
        # If this instance is in the database already, then it will have a
        # Primary Key value.
        # We can use the existence of a Primary Key to determine if this is the
        # first call to `save()`
        is_creation = False
        if not self.pk:
            is_creation = True
        print(self.pk)
        super(Item, self).save(*args, **kwargs)
        # If this call to `save` is creating a new Item, then we must also create
        # a CustomValue for each CustomField that currently exists.
        # Note that this block won't run if we're simply updating this Item via
        # the `save` method. This should strictly run upon creation.
        if is_creation:
            # create an empty CustomValue associated with this Item for each CustomField
            for cf in CustomField.objects.all():
                cv = CustomValue(field=cf, item=self)
                cv.save()



class CartItem(models.Model):
    owner    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    item     = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)



class CustomField(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    private     = models.BooleanField(default=False)
    field_type  = models.CharField(max_length=1, choices=FIELD_TYPES, default='s')

    def save(self, *args, **kwargs):
        # Determine if this `save()` call is for creation or modification
        is_creation = False
        if not self.pk:
            is_creation = True
        super(CustomField, self).save(*args, **kwargs)
        if is_creation:
            # create a null value for each item that currently exists
            for item in Item.objects.all():
                satisfied_fields = set( val.field.name for val in item.values.all() )
                if self.name not in satisfied_fields:
                    cv = CustomValue(field=self, item=item)
                    cv.save()


class CustomValue(models.Model):
    field = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="values", to_field="name")
    item  = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="values")
    s = models.CharField(default='', max_length=100, blank=True)
    m = models.TextField(default='', max_length=500, blank=True)
    i = models.IntegerField(default=0, blank=True)
    f = models.FloatField(default=0.0, blank=True)

    def get_value(self):
            return getattr(self, self.field.field_type)

class Request(models.Model):
    requester      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="requests")
    date_open      = models.DateTimeField(blank=True, null=True)
    open_comment   = models.TextField(default='', max_length=500, blank=True)
    date_closed    = models.DateTimeField(blank=True, null=True)
    closed_comment = models.TextField(max_length=500, blank=True)
    status          = models.CharField(max_length = 10, choices=STATUS_CHOICES, default=OUTSTANDING)
    administrator  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_administrated', blank=True, null=True)


class RequestItem(models.Model):
    request   = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='request_items', blank=True, null=True)
    item      = models.ForeignKey(Item, on_delete=models.DO_NOTHING)
    quantity  = models.PositiveIntegerField(default=0)


class Transaction(models.Model):
    item                = models.ForeignKey(Item, on_delete=models.CASCADE)
    ACQUISITION = 'Acquisition'
    LOSS = 'Loss'
    category_choices    = (
        (ACQUISITION, ACQUISITION),
        (LOSS, LOSS),
    )
    category            = models.CharField(max_length = 20, choices=category_choices)
    quantity            = models.PositiveIntegerField()
    comment             = models.CharField(max_length = 100, blank=True, null=True)
    date                = models.DateTimeField()
    administrator       = models.ForeignKey(User, on_delete=models.CASCADE)
