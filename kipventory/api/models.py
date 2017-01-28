from django.db import models

# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=100)
    class Meta:
        ordering=('name',)

    def __str__(self):
        return self.name

class Item(models.Model):
    part_no = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=100)
    quantity = models.IntegerField(default=0)
    description = models.TextField(max_length=500)

    class Meta:
        ordering = ('part_no',)

    def __str__(self):
        return self.name
