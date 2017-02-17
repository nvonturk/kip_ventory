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

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name



class KipventoryUser(models.Model):
    auth_user = models.OneToOneField(User, on_delete=models.CASCADE)
    netid = models.CharField(default='', max_length=100, blank=True)



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
