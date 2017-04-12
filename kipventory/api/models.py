from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import copy
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
import uuid

LOAN = 'loan'
DISBURSEMENT = 'disbursement'

LOANED = "Loaned"
DISBURSED = "Disbursed"
IN_STOCK = 'In Stock'

# Types of item requests
ITEM_REQUEST_TYPES = (
    (LOAN, 'Loan'),
    (DISBURSEMENT, 'Disbursement'),
)

ASSET_STATUS_TYPES = (
    (IN_STOCK, 'In Stock'),
    (LOANED, "Loaned"),
    (DISBURSED, "Disbursed"),
)

FIELD_TYPES = (
    ('Single', 'Single-line text'),
    ('Multi', 'Multi-line text'),
    ('Int', 'Integer'),
    ('Float', 'Float'),
)

FIELD_TYPE_DICT = {
    'Single': str,
    'Multi': str,
    'Int': int,
    'Float': float
}

ACQUISITION      = 'Acquisition'
LOSS             = 'Loss'
CATEGORY_CHOICES = (
    (ACQUISITION, ACQUISITION),
    (LOSS, LOSS),
)

OUTSTANDING = 'O'
APPROVED = 'A'
DENIED = 'D'

### Status Choices - used for Requests  ###
STATUS_CHOICES = (
    (OUTSTANDING, 'Outstanding'),
    (APPROVED, 'Approved'),
    (DENIED, 'Denied'),
)

BACKFILL_REQUEST_STATUS_CHOICES = (
    (OUTSTANDING, 'Outstanding'),
    (APPROVED, 'Approved'),
    (DENIED, 'Denied'),
)

AWAITING_ITEMS = 'awaiting_items'
SATISFIED = 'satisfied'

BACKFILL_STATUS_CHOICES = (
    (AWAITING_ITEMS, 'Awaiting Items'),
    (SATISFIED, 'Satisfied'),
)


# Create your models here.
class Tag(models.Model):
    name = models.CharField(max_length=128, unique=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name

class Item(models.Model):
    name        = models.CharField(max_length=256, unique=True)
    minimum_stock = models.PositiveIntegerField(default=0)
    quantity    = models.PositiveIntegerField(default=0)
    model_no    = models.CharField(default='', max_length=256, blank=True)
    description = models.TextField(default='', max_length=1024, blank=True)
    tags        = models.ManyToManyField(Tag, blank=True)
    has_assets  = models.BooleanField(default=False)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return "{}".format(self.name)

    def save(self, *args, **kwargs):
        # If this instance is in the database already, then it will have a
        # Primary Key value.
        # We can use the existence of a Primary Key to determine if this is the
        # first call to `save()`
        is_creation = False
        if not self.pk:
            is_creation = True

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
            if self.has_assets:
                for i in range(self.quantity):
                    asset = Asset.objects.create(item=self)

def uuid_to_str():
    return str(uuid.uuid4())

class Asset(models.Model):
    tag = models.AutoField(primary_key=True)
    item = models.ForeignKey('Item', on_delete=models.CASCADE, related_name="assets")
    status = models.CharField(max_length=15, choices=ASSET_STATUS_TYPES, default=IN_STOCK)

    class Meta:
        ordering = ('tag',)

    def __str__(self):
        return "{}: {}".format(self.item.name, self.pk)

    def save(self, *args, **kwargs):
        is_creation = False
        if not self.pk:
            is_creation = True
        super().save(*args, **kwargs)

        if is_creation:
            # create an empty CustomAssetValue associated with this Item for each CustomField
            for cf in CustomField.objects.filter(asset_tracked=True):
                cv = CustomAssetValue(field=cf, asset=self)
                cv.save()

class CartItem(models.Model):
    owner        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    item         = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity     = models.PositiveIntegerField(default=0)
    request_type = models.CharField(max_length=15, choices=ITEM_REQUEST_TYPES, default=DISBURSEMENT)

    class Meta:
        ordering = ('item__name',)

class CustomField(models.Model):
    name           = models.CharField(max_length=128, unique=True)
    private        = models.BooleanField(default=False)
    field_type     = models.CharField(max_length=10, choices=FIELD_TYPES, default='Single')
    asset_tracked  = models.BooleanField(default=False)

    class Meta:
        ordering = ('name',)

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

            if self.asset_tracked:
                for asset in Asset.objects.all():
                    satisfied_fields = set( val.field.name for val in asset.values.all() )
                    if self.name not in satisfied_fields:
                        cv = CustomAssetValue(field=self, asset=asset)
                        cv.save()

    def __str__(self):
        return "{}".format(self.name)

class CustomValue(models.Model):
    field  = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="item_values", to_field="name")
    item   = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="values")
    Single = models.CharField(default='', max_length=256, blank=True)
    Multi  = models.TextField(default='', max_length=1024, blank=True)
    Int    = models.IntegerField(default=0, blank=True)
    Float  = models.FloatField(default=0.0, blank=True)

    class Meta:
        ordering = ('field__name',)

    def get_value(self):
        return getattr(self, self.field.field_type)

    def __str__(self):
        return "{}, {}, {}".format(self.item, self.field, self.get_value())

class CustomAssetValue(models.Model):
    field  = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="asset_values", to_field="name")
    asset  = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="values")
    Single = models.CharField(default='', max_length=256, blank=True)
    Multi  = models.TextField(default='', max_length=1024, blank=True)
    Int    = models.IntegerField(default=0, blank=True)
    Float  = models.FloatField(default=0.0, blank=True)

    class Meta:
        ordering = ('field__name',)

    def get_value(self):
        return getattr(self, self.field.field_type)

    def __str__(self):
        return "{}, {}, {}".format(self.item, self.field, self.get_value())

class Request(models.Model):
    requester      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="requests")
    date_open      = models.DateTimeField(blank=True, auto_now_add=True)
    open_comment   = models.TextField(default='', max_length=1024, blank=True)
    date_closed    = models.DateTimeField(blank=True, null=True)
    closed_comment = models.TextField(max_length=1024, blank=True)
    status         = models.CharField(max_length=15, choices=STATUS_CHOICES, default=OUTSTANDING)
    administrator  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_administrated', blank=True, null=True)

    class Meta:
        ordering = ('-date_open',)

class RequestedItem(models.Model):
    request      = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='requested_items', blank=True, null=True)
    item         = models.ForeignKey(Item,    on_delete=models.CASCADE, related_name='requested_items', blank=True, null=True)
    quantity     = models.PositiveIntegerField(default=0)
    request_type = models.CharField(max_length=15, choices=ITEM_REQUEST_TYPES, default=LOAN)

    class Meta:
        ordering = ('item__name',)

class ApprovedItem(models.Model):
    request      = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='approved_items', blank=True, null=True)
    item         = models.ForeignKey(Item,    on_delete=models.CASCADE)
    assets       = models.ManyToManyField(Asset, blank=True)
    quantity     = models.PositiveIntegerField(default=0)
    request_type = models.CharField(max_length=15, choices=ITEM_REQUEST_TYPES, default=LOAN)

    class Meta:
        ordering = ('item__name',)

    def save(self, *args, **kwargs):
        is_creation = False
        if not self.pk:
            is_creation = True
        assets = kwargs.pop('assets', [])
        super().save(*args, **kwargs)
        for asset in assets:
            self.assets.add(asset)

        if is_creation:
            self.createLoansAndDisbursements()

    def createLoansAndDisbursements(self):
        if (self.assets.all().count() > 0):
            for asset in self.assets.all():
                if self.request_type == DISBURSEMENT:
                    disbursement = Disbursement.objects.create(request=self.request, item=self.item, asset=asset, quantity=1)
                    asset.status = DISBURSED
                elif self.request_type == LOAN:
                    loan = Loan.objects.create(request=self.request, item=self.item, asset=asset, quantity_loaned=1)
                    asset.status = LOANED

                asset.save()
                self.item.quantity -= 1
                self.item.save()

        else:
            if self.request_type == DISBURSEMENT:
                disbursement = Disbursement.objects.create(request=self.request, item=self.item, quantity=self.quantity)
            elif self.request_type == LOAN:
                loan = Loan.objects.create(request=self.request, item=self.item, quantity_loaned=self.quantity)
            self.item.quantity -= self.quantity
            self.item.save()




class Loan(models.Model):
    request            = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='loans', blank=True, null=True)
    item               = models.ForeignKey(Item, on_delete=models.CASCADE)
    asset              = models.ForeignKey(Asset, on_delete=models.SET_NULL, related_name="loans", blank=True, null=True)
    date_loaned        = models.DateTimeField(blank=True, auto_now_add=True)
    date_returned      = models.DateTimeField(blank=True, null=True)
    quantity_loaned    = models.PositiveIntegerField(default=0)
    quantity_returned  = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ('id',)

    def save(self, *args, **kwargs):
        is_creation = False
        if not self.pk:
            is_creation = True
        super().save(*args, **kwargs)
        if is_creation:
            if self.asset:
                if (self.quantity_loaned > self.quantity_returned):
                    self.asset.status = LOANED
                elif (self.quantity_loaned == self.quantity_returned):
                    self.asset.status = IN_STOCK
                self.asset.save()


class Disbursement(models.Model):
    request    = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='disbursements', blank=True, null=True)
    item       = models.ForeignKey(Item, on_delete=models.CASCADE)
    asset      = models.ForeignKey(Asset, on_delete=models.SET_NULL, related_name="disbursements", blank=True, null=True)
    date       = models.DateTimeField(blank=True, auto_now_add=True)
    quantity   = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        is_creation = False
        if not self.pk:
            is_creation = True
        super().save(*args, **kwargs)
        if is_creation:
            if self.asset:
                self.asset.status = DISBURSED
                self.asset.save()


class Transaction(models.Model):
    item          = models.ForeignKey(Item, on_delete=models.CASCADE)
    assets        = models.ManyToManyField(Asset, blank=True)
    category      = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity      = models.PositiveIntegerField()
    comment       = models.CharField(max_length=1024, blank=True, null=True)
    date          = models.DateTimeField(blank=True, auto_now_add=True)
    administrator = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ('-id',)

class BulkImport(models.Model):
    administrator   = models.ForeignKey(User, on_delete=models.CASCADE)
    data            = models.FileField()
    date_created    = models.DateTimeField(blank=True, auto_now_add=True)

class Log(models.Model):
    item                    = models.ForeignKey(Item, on_delete=models.SET_NULL, blank=True, null=True)
    quantity                = models.PositiveIntegerField(blank=True, null=True)
    initiating_user         = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='initiating_user', null=True)
    affected_user           = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='affected_user', blank=True, null=True)
    date_created            = models.DateTimeField(blank=True, auto_now_add=True)
    message                 = models.CharField(max_length=1024, blank=True, null=True)
    request                 = models.ForeignKey(Request, on_delete=models.SET_NULL, blank=True, null=True)
    # default values for the foreignkeys in the event those items are deleted or users etc.
    default_item            = models.CharField(max_length=256, blank=True, null=True)
    default_initiating_user = models.CharField(max_length=256, blank=True, null=True)
    default_affected_user   = models.CharField(max_length=256, blank=True, null=True)

    # The following categories detail what type of inventory change occurred
    ITEM_CREATION                   = "Item Creation"
    ITEM_MODIFICATION               = "Item Modification"
    ITEM_DELETION                   = "Item Deletion"
    REQUEST_ITEM_CREATION           = "Request Item Creation"
    REQUEST_ITEM_APPROVAL_LOAN      = "Request Item Approval: Loan"
    REQUEST_ITEM_APPROVAL_DISBURSE  = "Request Item Approval: Disburse"
    REQUEST_ITEM_LOAN_MODIFY        = "Request Item Loan Modify"
    REQUEST_ITEM_LOAN_TO_DISBURSE   = 'Request Item Loan Changed to Disburse'
    REQUEST_ITEM_DENIAL             = "Request Item Denial"
    USER_CREATION                   = "User Creation"
    TRANSACTION_CREATION            = "Transaction Creation"
    category_choices2    = (
        (ITEM_MODIFICATION, ITEM_MODIFICATION),
        (ITEM_CREATION, ITEM_CREATION),
        (ITEM_DELETION, ITEM_DELETION),
        (REQUEST_ITEM_CREATION, REQUEST_ITEM_CREATION),
        (REQUEST_ITEM_APPROVAL_LOAN, REQUEST_ITEM_APPROVAL_LOAN),
        (REQUEST_ITEM_APPROVAL_DISBURSE, REQUEST_ITEM_APPROVAL_DISBURSE),
        (REQUEST_ITEM_LOAN_TO_DISBURSE, REQUEST_ITEM_LOAN_TO_DISBURSE),
        (REQUEST_ITEM_LOAN_MODIFY, REQUEST_ITEM_LOAN_MODIFY),
        (REQUEST_ITEM_DENIAL, REQUEST_ITEM_DENIAL),
        (USER_CREATION, USER_CREATION),
        (TRANSACTION_CREATION, TRANSACTION_CREATION),
    )
    category            = models.CharField(max_length=50, choices=category_choices2)

    class Meta:
        ordering = ('-date_created',)

    def __str__(self):
        return "{} {}".format(self.date_created, self.item, self.quantity, self.initiating_user, self.affected_user)

    def createDefaults(self):
        if self.item is not None:
            self.default_item            = copy.deepcopy(self.item.name)
        if self.affected_user is not None:
            self.default_affected_user   = copy.deepcopy(self.affected_user.username)
        if self.initiating_user is not None:
            self.default_initiating_user = copy.deepcopy(self.initiating_user.username)

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.createDefaults()
            super(Log, self).save(*args, **kwargs)

# Extra info about a user
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    subscribed = models.BooleanField(default=False)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance, subscribed=False)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

@receiver(pre_delete, sender=User)
def delete_profile_for_user(sender, instance=None, **kwargs):
    if instance:
        profile = Profile.objects.get(user=instance)
        profile.delete()

class LoanReminder(models.Model):
    date = models.DateField()
    body = models.TextField(max_length=1024)
    subject = models.CharField(max_length=128, default="")
    sent = models.BooleanField(default=False)

# Todo only allow one object. maybe use django-solo
class SubjectTag(models.Model):
    text = models.CharField(max_length=128, unique=True)

class BackfillRequest(models.Model):
    loan = models.ForeignKey('Loan', on_delete=models.CASCADE, related_name="backfill_requests")
    requester_comment = models.TextField(max_length=1024)
    receipt = models.FileField(upload_to="backfill/", blank=True, null=True)
    status = models.CharField(max_length=15, choices=BACKFILL_REQUEST_STATUS_CHOICES, default=OUTSTANDING)
    admin_comment = models.TextField(default='', max_length=1024, blank=True)

class Backfill(models.Model):
    request            = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='backfills', blank=True, null=True)
    item               = models.ForeignKey(Item, on_delete=models.CASCADE)
    date_created       = models.DateTimeField(blank=True, auto_now_add=True)
    date_satisfied      = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=15, choices=BACKFILL_STATUS_CHOICES, default=AWAITING_ITEMS)
    quantity = models.PositiveIntegerField(default=0)
    # to add partial per-item backfill, replace status with quantity_backfilled and quantity_returned
    # backfillrequest fields
    requester_comment = models.TextField(max_length=1024)
    receipt = models.FileField(upload_to="backfill/", blank=True, null=True)
    admin_comment = models.TextField(default='', max_length=1024, blank=True)

