API Documentation
=================

This document details how to interact with the REST API via HTTP methods.


Models
------
Detailed description of all fields in the backend models.

#### User

###### Fields
```
id         --> IntegerField (Alias of 'pk' field)
username   --> CharField
email      --> EmailField
first_name --> CharField
last_name  --> CharField
is_staff   --> BooleanField
```
#### Item
```
id          --> IntegerField (Alias of 'pk' field)
name        --> CharField
location    --> CharField
model       --> CharField
quantity    --> IntegerField
description --> TextField
tags        --> ManyToManyField --> Tag (each item has many tags)
```
#### Request
```
id          --> IntegerField (Alias of 'pk' field)
name        --> CharField
location    --> CharField
model       --> CharField
quantity    --> IntegerField
description --> TextField
tags        --> ManyToManyField --> Tag (each item has many tags)
```

#### CartItem

#### Tag

REST Endpoints
------------
