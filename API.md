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
#### NewUserRequest
```
username            --> CharField
first_name          --> CharField
last_name           --> CharField
email               --> CharField
comment             --> CharField
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


Technologies
------------

The following technologies are used for the kip-ventory web app:
  * Django
    * web framework in Python used for the backend and code organization
    * Dependencies
      * our python code contains a few dependencies listed in requirements.txt
  * React.js
    * frontend UI framework that makes it easier to create interactive UIs
    * Dependencies
      * our React code contains a few dependencies listed in package.json
  * Postgres
    * used for our database
  * Webpack
    * a module bundler used to bundle all of the code dependencies into static assets

High Level Design
------------

There are two distinct kinds of users of the kip-ventory web app: admins and common users. The website is set up so that both admins and common users have almost the same experience, with the admin having a few special privileges. The website is mostly a single page app, with React router being used to mimic url routing for different parts of the home page. The only true pages that are at different url endpoints are the login page and the admin panel.

####Login Page (/)

  * When a user first goes to the website, the page gives the option of logging in (if the user already has an account) or signing up for an account. Signing up creates a new User object with the specified fields, and logging in checks the credentials against an existing User in the database. Once signed in, the user is redirected to the main app at /app/.

####Main app (/app/)

  * On the main app page there are a few different "pages" that the user can navigate between

* Inventory

  * In this view, a list of all items in the ECE inventory are shown. This is done by making an AJAX call to the /api/items endpoint. The items are paginated, and the user can search by name/model no or filter by included/excluded tags.  Filtering and searching is also done by making an AJAX call to /api/items, while also appending query parameters to specify the selected filters. The tags to select from are shown in a drop down and are retrieved from /api/tags.

  * When the user clicks an item, a modal window pops up with information about the item. In addition to item parameters, this also includes all of the user's outstanding requests for that item. The user can enter a quantity and add the item to his/her cart. When the user hits Add To Cart, a POST request is sent to /api/cart that creates a CartItem object with the item and quantity selected. Once the user adds all items of interest to his/her cart, the user can navigate to the Cart tab to initiate a request for those items.

  * If the user is an admin, all outstanding requests for an item are shown in the modal window for that item, regardless of user. In addition, a Create Transactions button is shown. This button pops up another modal window, where the admin can initiate a transaction that logs the Acquisition or Loss of the selected item. When the admin his create transaction, a POST request is sent to /api/transaction, where a transaction object is created and shows up under the transactions list in the Admin tab.

* Cart

  * In this view, the user can see all of the items he/she has added to his/her cart. The user can update any of the quantities, and initiate a request for those items. This brings up a request form, in which the user fills out a few fields and initiates a request. A POST request is sent to /api/request to store the request for each item in the database. The requests now show up in the Requests tab.

* Requests

  * In this view, the user can see all of the requests they've made (GET /api/requests). They can filter the requests by status: Outstanding, Approved, or Denied.

* Profile

  * This tab displays basic information about the current user.  This tab also allows the user to generate a permission-restricted alphanumeric API token for out of application API calls.

* Logout

  * This button logs out the current user and redirects them to the login page.

* Manage

  * This view is contains the majority of functionality availability to managers and admins.
    * Disburse Items
      * The admin can choose to disburse an item directly to a user without a user initiated request. Disbursing an item makes a POST to /api/disburse, which creates a Request with status Approved for the specified item and user.
    * Respond to Requests
      * The admin can see a list of all requests made for all items, and can filter by request status. Clicking an outstanding request allows the admin to approve our deny the request.
    * View transactions history
      * The admin can see a list of all transactions, and can filter by transaction type: Acquisition or loss.
    * Item Creation
      * Admins and managers may create new items.
    * Custom Fields Management
      * Admins and managers may create and remove customized data fields for items in the inventory system. These fields are comprised of four different types short text, long text, integer, and float.
    * Transactions   
      * Admins and managers may view a history of transactions in the inventory system.  Transactions are created for a specific item in the Item Detail view (/app/items/{item_name}/).
    * Logs
      * Admins and managers may view a read-only log of all major events in the system.
    * Tags
      * Admins and managers may view a list of item tags in the system, and delete and create tags.  Tags are unique and and identical tags may not be created.

* Admin

  * This view is only shown if the user is an admin, and contains a few admin-exclusive controls.
    * Create Users
      * Administrators may create new users in the systems.
    * Manage Users
      * Administrators may manage the information of users and their varying permission levels.  
    * Admin Panel
      * Administrators have access to the Django admin panel with can provide more fine-grained controls if necessary.  However we believe the great majority of functionality is encapsulated within the web application's Admin and Manage views.

* API Test

  * This view directs the user to a Swagger Documentation view that will allow them to test the API endpoints using an access token that is in accordance with their permission level.  Tokens must be obtained from the Profile view inside the application.



####Admin panel (/admin/)

  * This view is the Django admin panel, where the admin can go to create items and tags and manage many things. Eventually much of this functionality will be moved to the main app.

####Api (/api/)

  * Our REST api endpoints live at /api. The endpoints are described above, and used in all of our views to make the website interactive and display data.

Configuration
------------

The [readme](https://github.com/nbv3/kip_ventory/blob/docs/README.md) on the kip-ventory github page contains detailed instructions on how to setup and install your own version of the web app.
