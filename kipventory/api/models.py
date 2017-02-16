from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

FIELD_TYPES = (
    ('s', 'Short'),
    ('l', 'Long'),
    ('i', 'Integer'),
    ('f', 'Float'),
)

FIELD_TYPE_DICT = {
    's': str,
    'l': str,
    'i': int,
    'f': float
}

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class Item(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    quantity    = models.PositiveIntegerField(default=0)
    model_no    = models.CharField(max_length=100, blank=True)
    description = models.TextField(max_length=500, blank=True)
    tags        = models.ManyToManyField(Tag, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super(Item, self).save(*args, **kwargs)
        # create a null CustomValue associated with this Item for each CustomField
        value_names = set(x.field.name for x in self.values.all())

        for cf in CustomField.objects.all():
            if cf.name not in value_names:
                cv = CustomValue(field=cf, item=self)
                cv.save()
#
# class CustomFieldCollection(models.Model):
#     item = models.OneToOneField(Item, related_name="field_collection")

class CartItem(models.Model):
    owner    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    item     = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return "{} {}(s) in {}'s cart.".format(self.item.name, self.owner, self.quantity)


class CustomField(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    private     = models.BooleanField(default=False)
    field_type  = models.CharField(max_length=1, choices=FIELD_TYPES, default='s')

    def __str__(self):
        return self.name + ": " + self.field_type

    def save(self, *args, **kwargs):
        super(CustomField, self).save(*args, **kwargs)
        # create a null value for each item that currently exists
        for item in Item.objects.all():
            cv = CustomValue(field=self, item=item)
            cv.save()

class CustomValue(models.Model):
    field = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="values", to_field="name")
    item  = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="values")
    s = models.CharField(default='', max_length=100, blank=True)
    l = models.TextField(default='', max_length=500, blank=True)
    i = models.IntegerField(default=0, blank=True)
    f = models.FloatField(default=0.0, blank=True)

    def get_value(self):
        return getattr(self, self.field.field_type)
