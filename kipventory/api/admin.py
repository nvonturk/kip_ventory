from django.contrib import admin

from . import models

# Register your models here.
admin.site.register(models.Item)
admin.site.register(models.Asset)

admin.site.register(models.CartItem)

admin.site.register(models.Tag)

admin.site.register(models.CustomField)
admin.site.register(models.CustomValue)
admin.site.register(models.CustomAssetValue)

admin.site.register(models.Transaction)

admin.site.register(models.Request)
admin.site.register(models.RequestedItem)
admin.site.register(models.ApprovedItem)

admin.site.register(models.Loan)
admin.site.register(models.Disbursement)

admin.site.register(models.BulkImport)
admin.site.register(models.LoanReminder)
admin.site.register(models.SubjectTag)
