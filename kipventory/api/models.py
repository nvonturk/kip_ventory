from django.db import models
from django.contrib.auth.models import User


field_types = (
    ('S', 'Short'),
    ('L', 'Long'),
    ('I', 'Integer'),
    ('F', 'Float'),
)

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

#
# class CustomFieldCollection(models.Model):
#     item = models.OneToOneField(Item, related_name="field_collection")

class CartItem(models.Model):
    owner    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    item     = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    def __str__(self):
        return "{} {}(s) in {}'s cart.".format(self.item.name, self.item.owner, self.owner.quantity)


class CustomField(models.Model):
    name        = models.CharField(max_length=100)
    value       = models.CharField(max_length=500)
    private     = models.BooleanField(default=False)
    item        = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="custom_fields")
    field_type  = models.CharField(max_length=1, choices=field_types, default='S')

    def __str__(self):
        return self.name + ": " + self.value
