from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import copy


LOAN = 'loan'
DISBURSEMENT = 'disbursement'
# Types of item requests
ITEM_REQUEST_TYPES = (
    (LOAN, 'Loan'),
    (DISBURSEMENT, 'Disbursement'),
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
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        ordering = ('name',)

    def __str__(self):
        return self.name


class NewUserRequest(models.Model):
    username   = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=30)
    last_name  = models.CharField(max_length=30)
    email      = models.CharField(max_length=150, unique=True)
    comment    = models.CharField(max_length=300, blank=True)

class Item(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    quantity    = models.PositiveIntegerField(default=0)
    model_no    = models.CharField(default='', max_length=100, blank=True)
    description = models.TextField(default='', max_length=500, blank=True)
    tags        = models.ManyToManyField(Tag, blank=True)

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

class CartItem(models.Model):
    owner        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    item         = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity     = models.PositiveIntegerField(default=0)
    request_type = models.CharField(max_length=15, choices=ITEM_REQUEST_TYPES, default=DISBURSEMENT)
    due_date     = models.DateTimeField(blank=True, null=True, default=None)

    class Meta:
        ordering = ('item__name',)

class CustomField(models.Model):
    name        = models.CharField(max_length=100, unique=True)
    private     = models.BooleanField(default=False)
    field_type  = models.CharField(max_length=10, choices=FIELD_TYPES, default='Single')

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


class CustomValue(models.Model):
    field  = models.ForeignKey(CustomField, on_delete=models.CASCADE, related_name="values", to_field="name")
    item   = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="values")
    Single = models.CharField(default='', max_length=100, blank=True)
    Multi  = models.TextField(default='', max_length=500, blank=True)
    Int    = models.IntegerField(default=0, blank=True)
    Float  = models.FloatField(default=0.0, blank=True)

    class Meta:
        ordering = ('field__name',)

    def get_value(self):
            return getattr(self, self.field.field_type)

class Request(models.Model):
    requester      = models.ForeignKey(User, on_delete=models.CASCADE, related_name="requests")
    date_open      = models.DateTimeField(blank=True, auto_now_add=True)
    open_comment   = models.TextField(default='', max_length=500, blank=True)
    date_closed    = models.DateTimeField(blank=True, null=True)
    closed_comment = models.TextField(max_length=500, blank=True)
    status         = models.CharField(max_length=15, choices=STATUS_CHOICES, default=OUTSTANDING)
    administrator  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_administrated', blank=True, null=True)

    class Meta:
        ordering = ('date_open',)

class RequestedItem(models.Model):
    request      = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='requested_items', blank=True, null=True)
    item         = models.ForeignKey(Item,    on_delete=models.CASCADE)
    quantity     = models.PositiveIntegerField(default=0)
    request_type = models.CharField(max_length=15, choices=ITEM_REQUEST_TYPES, default=DISBURSEMENT)

    class Meta:
        ordering = ('item__name',)

class Loan(models.Model):
    request   = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='loaned_items', blank=True, null=True)
    item      = models.ForeignKey(Item, on_delete=models.DO_NOTHING)
    quantity  = models.PositiveIntegerField(default=0)
    return_date = models.DateTimeField(blank=True, null=True)

class Disbursement(models.Model):
    request   = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='disbursed_items', blank=True, null=True)
    item      = models.ForeignKey(Item, on_delete=models.DO_NOTHING)
    quantity  = models.PositiveIntegerField(default=0)


def createLoanFromRequestItem(ri):
    loan = Loan.objects.create(request=ri.request,
                               item=ri.item,
                               quantity=ri.quantity,
                               return_date=None)
    loan.save()
    return loan

def createDisbursementFromRequestItem(ri):
    disbursement = Disbursement.objects.create(request=ri.request,
                                               item=ri.item,
                                               quantity=ri.quantity)
    disbursement.save()
    return disbursement

class Transaction(models.Model):
    item             = models.ForeignKey(Item, on_delete=models.CASCADE)
    ACQUISITION      = 'Acquisition'
    LOSS             = 'Loss'
    category_choices = (
        (ACQUISITION, ACQUISITION),
        (LOSS, LOSS),
    )
    category      = models.CharField(max_length=20, choices=category_choices)
    quantity      = models.PositiveIntegerField()
    comment       = models.CharField(max_length=100, blank=True, null=True)
    date          = models.DateTimeField(blank=True, auto_now_add=True)
    administrator = models.ForeignKey(User, on_delete=models.CASCADE)

class Log(models.Model):
    item                    = models.ForeignKey(Item, on_delete=models.SET_NULL, blank=True, null=True)
    quantity                = models.PositiveIntegerField(blank=True, null=True)
    initiating_user         = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='initiating_user', null=True)
    affected_user           = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='affected_user', blank=True, null=True)
    date_created            = models.DateTimeField(blank=True, auto_now_add=True)
    message                 = models.CharField(max_length=100, blank=True, null=True)
    request                 = models.ForeignKey(Request, on_delete=models.SET_NULL, blank=True, null=True)
    # default values for the foreignkeys in the event those items are deleted or users etc.
    default_item            = models.CharField(max_length=100, blank=True, null=True)
    default_initiating_user = models.CharField(max_length=100, blank=True, null=True)
    default_affected_user   = models.CharField(max_length=100, blank=True, null=True)

    # The following categories detail what type of inventory change occurred
    ITEM_CREATION           = "Item Creation"
    ITEM_MODIFICATION       = "Item Modification"
    ITEM_DELETION           = "Item Deletion"
    REQUEST_ITEM_CREATION   = "Request Item Creation"
    REQUEST_ITEM_APPROVAL   = "Request Item Approval"
    REQUEST_ITEM_DENIAL     = "Request Item Denial"
    USER_CREATION           = "User Creation"
    TRANSACTION_CREATION    = "Transaction Creation"
    category_choices    = (
        (ITEM_MODIFICATION, ITEM_MODIFICATION),
        (ITEM_CREATION, ITEM_CREATION),
        (ITEM_DELETION, ITEM_DELETION),
        (REQUEST_ITEM_CREATION, REQUEST_ITEM_CREATION),
        (REQUEST_ITEM_APPROVAL, REQUEST_ITEM_APPROVAL),
        (REQUEST_ITEM_DENIAL, REQUEST_ITEM_DENIAL),
        (USER_CREATION, USER_CREATION),
        (TRANSACTION_CREATION, TRANSACTION_CREATION),
    )
    category            = models.CharField(max_length=25, choices=category_choices)

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
