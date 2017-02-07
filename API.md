API Documentation
=================

This document details how the database models are organized, and how to interact with the REST API via HTTP methods.


Models
------
Detailed description of all fields in the backend models.

#### User
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
photo_src   --> ImageField
location    --> CharField
model       --> CharField
quantity    --> IntegerField
description --> TextField
tags        --> ManyToManyField --> Tag (each Item has many Tags)
```
#### Request
Note: a few fields are optional because they are only filled when a request gets approved or denied
```
id              --> IntegerField (Alias of 'pk' field)
item            --> ForeignKey (each Request has one Item)
quantity        --> IntegerField
date_open       --> DateTimeField
open_reason     --> TextField
status          --> CharField (choices: 'Outstanding', 'Approved', 'Denied')
date_closed     --> DateTimeField (optional)
closed_comment  --> TextField (optional)
administrator   --> ForeignKey --> User (each Request has one User administrator) (optional)
```
#### CartItem
```
id          --> IntegerField (Alias of 'pk' field)
item        --> ForeignKey --> Item (each CartItem has one Item)
owner       --> ForeignKey --> User (each CartItem has one User owner)
quantity    --> IntegerField
```
#### Tag
```
id          --> IntegerField (Alias of 'pk' field)
name        --> CharField
```
#### Transactions
```
id            --> IntegerField (Alias of 'pk' field)
item          --> ForeignKey --> Item (each Transaction has one Item)
category      --> CharField (choices: 'Acquisition', 'Loss')
quantity      --> PositiveIntegerField
comment       --> CharField
date          --> DateTimeField
administrator --> ForeignKey --> User (each Transaction has one User administrator)
```

REST Endpoints
------------

The following is a list of all REST endpoints in the web app. Under each endpoint, the available actions are listed. If an action is not listed, it is not supported by the API. If permissions are not listed, any user can access that endpoint. If parameters are not listed, no data needs to be included with the HTTP request. 

* `/items/`
  * GET: get all items
* `/items/[id]/`
  * GET: get the item with the specified id
* `/requests/`
  * GET: get all requests made by the current user
  * POST: create a request 
    * Parameters (note: date_open, status, date_closed, closed_comment, and administrator should not be included in the POST data. date_open gets automatically set to the current time, status gets set to 'Outstanding', and the other fields get populated when an admin approves or denies a request)


      | Parameter   | Type             | Purpose                          | Required? |
      |-------------|------------------|----------------------------------|-----------|
      | item        | string           | the id of the Item               | yes       |
      | quantity    | positive integer | the amount of the Item requested | yes       |
      | open_reason | string           | reason for request               | yes       |


* `/requests/[id]/`
  * GET: get the request with the specified id
    * Permissions:  
      * Admin: can get any request
      * User: can only get own requests

  * PUT: approve or deny the request with the specified id
    * Permissions: must be an admin
    * Parameters: (note: this PUT request is to modify requests by approving or denying the request. Other modifications are not currently supported. If they are in the future, this PUT request should be moved to a different URL)


      | Parameter     | Type             | Purpose                                    | Required? |
      |-------------  |------------------|----------------------------------          |-----------|
      | quantity      | positive integer | the amount of the Item requested           | no        |
      | status        | string           | request status: 'Approved', or 'Denied'    | yes       |
      | closed_comment| string           | reason for approving or denying            | no        |


  * DELETE: delete the request with the specified id
    * Permissions: must be the request owner
* `/requests/all/`
  * GET: get all requests
    * Permissions: must be an admin
* `/disburse/`
  * POST: disburse an item to a user (i.e. automatically create and approve a request for a user)
    * Parameters (note: open_reason, open_date, date_closed, status, and administrator get auto-filled in the backend and should not be included in the POST data)


      | Parameter     | Type             | Purpose                                        | Required? |
      |-------------  |------------------|----------------------------------              |-----------|
      | item          | string           | the id of the Item to be disbursed             | yes       |
      | quantity      | positive integer | the amount of the Item requested               | yes       |
      | user          | string           | the id of the User to whom to disburse the item| yes       |
      | closed_comment| string           | reason for approving or denying                | no        |


* `/cart/`
  * GET: get all of the CartItems in the current user's Cart
  * POST: create a CartItem and add it to the current user's Cart, or update an existing CartItem's quantity if it already exists
    * Parameters: (note: 'owner' is automatically set to the current user and should not be included in the POST data)


    | Parameter | Type             | Purpose                          | Required? |
    |-----------|------------------|----------------------------------|-----------|
    | item      | string           | the id of the Item               | yes       |
    | quantity  | positive integer | the amount of the Item requested | yes       |


* `/cart/[id]/`
  * GET: get the cart item with the specified id
  * PUT: modify the quantity of the cart item with the specified id 
    * Parameters: 

    | Parameter | Type             | Purpose                          | Required? |
    |-----------|------------------|----------------------------------|-----------|
    | quantity  | positive integer | the amount of the Item requested | yes       |


  * DELETE: delete the cart item with the specified id
* `/tags/`
  * GET: get all tags in the database
* `/transactions/`
  * GET: get all transactions in the database
  * POST: create a transaction
    * Parameters (note: `date` and `administrator` get automatically set to current date and current user and should not be included in the POST data)


      | Parameter     | Type              | Purpose                                       | Required? |
      | ------------- | -------------     | -----                                         | ----      |
      | quantity      | postitive integer | the amount of the item acquired/lost          | yes       |
      | item          | string            | the id of the item acquired/lost              | yes       |
      | category      | string            | the transaction category: 'Acquired' or 'Lost'| yes       |
      | comment       | string            | a comment to explain the transaction          | no        |


* `/login/`
  * POST: authenticate and login a user
  * Parameters:


  | Parameter  | Type   | Purpose                   | Required? |
  |------------|--------|---------------------------|-----------|
  | username   | string | the new user's username   | yes       |
  | password   | string | the new user's password   | yes       |
 

* `/signup/`
  * POST: create a new user
  * Parameters:


  | Parameter  | Type   | Purpose                   | Required? |
  |------------|--------|---------------------------|-----------|
  | username   | string | the new user's username   | yes       |
  | password   | string | the new user's password   | yes       |
  | email      | string | the new user's email      | yes       |
  | first_name | string | the new user's first name | yes       |
  | last_name  | string | the new user's last name  | yes       |


* `/logout/`
  * GET: logout the current user
* `/users/`
  * GET: get all users
    * Permissions: must be an admin
* `/users/current/`
  * GET: get the current user
