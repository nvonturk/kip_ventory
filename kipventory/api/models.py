from django.db import models

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)
    class Meta:
        ordering=('name',)

    def __str__(self):
        return self.name


class Item(models.Model):
    part_no = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    class Meta:
        ordering = ('part_no',)

    def __str__(self):
        return self.name
