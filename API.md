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
*/items/
  *GET: get all items
*/items/[id]/
  *GET: get the item with the specified id
*/requests
  *GET: get all requests made by the current user
*/requests/[id]/
  *GET: get the request with the specified id
    *Permissions:  
      *Admin: can get any request
      *User: can only get own requests
  *PUT: modify the request with the specified id
    *Permissions: must be an admin
  *DELETE: delete the request with the specified id
    *Permissions: must be the request owner
*/requests/all/
  *GET: get all requests
    *Permissions: must be an admin
*/disburse/
  *POST: disburse an item to a user (i.e. automatically create and approve a request for a user)
*/cart/
  *GET: get all of the CartItems in the current user's Cart
  *POST: create a CartItem and add it to the current user's Cart, or update an existing CartItem's quantity if it already exists
*/cart/[id]/
  *GET: get the cart item with the specified id
  *PUT: modify the cart item with the specified id 
  *DELETE: delete the cart item with the specified id
*/tags/
  *GET: get all tags in the database
*/transactions/
  *GET: get all transactions in the database
  *POST: create a transaction
*/login/
  *POST: authenticate and login a user
*/signup/
  *POST: create a new user
*/logout/
  *GET: logout the current user
*/users/
  *GET: get all users
    *Permissions: must be an admin
*/users/current/
  *GET: get the current user
