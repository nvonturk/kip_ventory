API Documentation
=================

This document details how to interact with the REST API via HTTP methods.


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

#### Pagination
Note: many of the GET requests return paginated results. You can specify a `page` parameter to specify which page to retrieve and an `itemsPerPage` parameter to specify how many items per page for pagination. See Swagger to see which endpoints are paginated (they should show both `page` and `itemsPerPage` parameters). The paginated results return the following format:
``` 
{
  "count": totalNumberOfItems,
  "num_pages": totalNumberOfPages,
  "results": data, // an array of all items
} 
```

#### API Token
* '/apitoken'
  * GET: get an API token (must be logged in via application interface)

#### Backup Email
* '/backupemail/'
  * GET: initiate the sending of emails to administrative users notifying of backup results
  | Parameter | Type   | Purpose                                | Required? |
  |-----------|--------|----------------------------------------|-----------|
  | status    | string | backup result status (success/failure) | yes       |

#### Cart
* '/cart/'
  * GET: get the cart for the logged in user
* '/cart/{item_name}'
  * GET: get the number of a specified item in the user's cart
  * DELETE: delete a specified item from the user's cart
  * PUT: modify quantity of item in user's cart or whether item is requested for loan/disbursement
  | Parameter    | Type   | Purpose                                              | Required? |
  |--------------|--------|------------------------------------------------------|-----------|
  | quantity     | string | number of item to be requested                       | yes       |
  | request type | string | specify whether request will be loan or disbursement | yes       |

#### Disburse
* '/disburse/'
  * POST: create approved disbursals from an admin user to a regular user, logged in user defaults to admin user
  | Parameter      | Type          | Purpose                                                                      | Required? |
  |----------------|---------------|------------------------------------------------------------------------------|-----------|
  | requester      | string        | filter logs by user associated with entries                                  | yes       |
  | items          | string array  | array of item names being disbursed                                          | yes       |
  | types          | string array  | index related to items field, request type (loan/disbursement) for each item | yes       |
  | quantities     | integer array | index related to items field, requested quantity of each item                | yes       |
  | closed_comment | string        | administrator comment explaining action                                      | yes       |
  | open_comment   | string        | comment on opening of requests                                               | yes       |

#### Fields
* '/fields/'
  * GET: get all custom fields in system
  * POST: create a new custom field
  | Parameter  | Type    | Purpose                                                   | Required? |
  |------------|---------|-----------------------------------------------------------|-----------|
  | private    | boolean | whether or not field is hidden to non-admin/manager users | yes       |
  | name       | string  | the name of the custom field                              | yes       |
  | field_type | string  | one of four custom field types (Single/Multi/Float/Int)   | yes       |
* '/fields/{field_name}'
  * DELETE: delete a specified custom field
  * GET: get the information associated with a specified custom field

#### Import
* '/import/'
  * POST: initiate a bulk import, a files is included with this request
  | Parameter     | Type   | Purpose                         | Required? |
  |---------------|--------|---------------------------------|-----------|
  | administrator | string | administrator initiating import | yes       |
* '/import/tempalte/'
  * GET: get the CSV bulk import template

#### Items
* `/items/`
  * GET: get all items
  * POST: create a new item
  | Parameter   | Type             | Purpose                          | Required? |
  |-------------|------------------|----------------------------------|-----------|
  | model_no    | string           | the id of the item               | yes       |
  | description | string           | description of item              | yes       |
  | quantity    | positive integer | amount of item in inventory      | yes       |
  | name        | string           | colloquial name of item          | yes       |
  | tags        | string array     | tags associated with item        | yes       |

* `/items/{item_name}/`
  * GET: get the item with the specified item name
  * DELETE: delete the item with the specified item name
  * PUT: modify the values of a currently existing item
  | Parameter   | Type             | Purpose                          | Required? |
  |-------------|------------------|----------------------------------|-----------|
  | model_no    | string           | the id of the item               | yes       |
  | description | string           | description of item              | yes       |
  | quantity    | positive integer | amount of item in inventory      | yes       |
  | name        | string           | colloquial name of item          | yes       |
  | tags        | string array     | tags associated with item        | yes       |
* `/items/{item_name}/addtocart`
  * POST: add an item to the logged in user's cart.
  | Parameter    | Type             | Purpose                                                     | Required? |
  |--------------|------------------|-------------------------------------------------------------|-----------|
  | quantity     | positive integer | number of items requested                                   | yes       |
  | request type | string           | delineates whether item is request for loan or disbursement | yes       |
* `/items/{item_name}/fields`
  * GET: get the values of all custom fields for an item
* `/items/{item_name}/fields/{field_name}`
  * GET: get the value of a specified custom field for an item
  * PUT: modify the value of a specified custom field for an item
  | Parameter | Type   | Purpose                                                        | Required? |
  |-----------|--------|----------------------------------------------------------------|-----------|
  | value     | string | custom field value, parsed into required field type on backend | yes       |
* `/items/{item_name}/loans`
  * GET: get all loans associated with an item.
  | Parameter | Type   | Purpose                 | Required? |
  |-----------|--------|-------------------------|-----------|
  | user      | string | filter loans by user    | no        |
* `/items/{item_name}/requests`
  * GET: get all requests associated with an item
  | Parameter | Type   | Purpose                         | Required? |
  |-----------|--------|---------------------------------|-----------|
  | type      | string | fitler requests by request type | no        |
  | user      | string | filter requests by user         | no        |
* `/items/{item_name}/stacks`
  * GET: get item stack values for a specified item
* `/items/{item_name}/transactions`
  * GET: get all transactions associated with a specified item
  | Parameter     | Type   | Purpose                                       | Required? |
  |---------------|--------|-----------------------------------------------|-----------|
  | category      | string | filter transactions by transaction category   | no        |
  | administrator | string | filter transactions by administrator username | no        |

#### Loan Reminders
* `/loanreminders/`
  * GET: get all loan reminders
    * Permissions: must be a manager
    * Query params:

    | Parameter  | Type   | Purpose                   | Required? |
    |------------|--------|---------------------------|-----------|
    | sent   | boolean | Filter by loan reminder status (sent or not sent yet)    | no      |

  * POST: create a loan reminder
    * Permissions: must be a manager
    * date must be able to parsed by python's dateutil.parser.parse
    * Sample data:
    ```
    {
      "subject": "string",
      "body": "string",
      "date": "string"
    }
    ```

* `/loanreminders/{id}`
  * PUT: modify a loan reminder with specified id
    * Permissions: must be a manager
    * date must be able to parsed by python's dateutil.parser.parse
    * Sample data:
    ```
    {
      "subject": "string",
      "body": "string",
      "date": "string"
    }

  * DELETE: delete a loan reminder with specified id

#### Loans
* `/loans/`
  * GET: get all loans loaned to current user
    * Query params:

    | Parameter  | Type   | Purpose                   | Required? |
    |------------|--------|---------------------------|-----------|
    | status  | string | Filter by loan status (Outstanding, Returned)   | no      |
    | item   | string | Filter by item name   | no       |

* `/loans/all/`
  * GET: get all loans 
    * Permissions: must be a manager
    * Query params:

    | Parameter  | Type   | Purpose                   | Required? |
    |------------|--------|---------------------------|-----------|
    | status  | string | Filter by loan status (Outstanding, Returned)   | no      |
    | item   | string | Filter by item name   | no       |

* `/loans/{id}/`
  * GET: get the loan with the specific id
    * Permissions: must be a manager unless the user owns the specified loan
  * PUT: mark a loan as returned
    * Permissions: must be a manager
    * Sample data
    ```
    {
      "quantity_returned": 0,
      "date_returned": "string"
    }
    ```

* `/loans/{id}/convert/`
  * POST: convert a loan to a disbursement
    * Permissions: must be a manager
    * Sample data
    ```
    {
      "quantity": 0
    }
    ```

#### Login
* `/login/`
  * POST: authenticate and login a user
  * Parameters:


  | Parameter  | Type   | Purpose                   | Required? |
  |------------|--------|---------------------------|-----------|
  | username   | string | the new user's username   | yes       |
  | password   | string | the new user's password   | yes       |

#### Logout
  * `/logout/`
  * GET: logout the current user

#### Logs
* '/logs/'
  * GET: get logs in system
  | Parameter | Type   | Purpose                                     | Required? |
  |-----------|--------|---------------------------------------------|-----------|
  | user      | string | filter logs by user associated with entries | no        |
  | item      | string | filter logs by item associated with entries | no        |
  | endDate   | string | filter logs by an end date                  | no        |
  | startDate | string | filter logs by start date                   | no        |

#### NetId Token
* '/netidtoken/'
  * GET: get a NetId Token from the OAuth server
  | Parameter | Type   | Purpose                                  | Required? |
  |-----------|--------|------------------------------------------|-----------|
  | code      | string | temporary validated code from Duke OAuth | yes       |

#### Requests
* `/requests/`
  * GET: get all requests made by the current user
    * Query params:
     
      | Parameter   | Type             | Purpose                          | Required? |
      |-------------|------------------|----------------------------------|-----------|
      | status      | string           | Filter by status (Outstanding, Approved, or Denied) | no       |

  * POST: create a request for the current user for the items currently in his/her cart
      
      | Parameter   | Type             | Purpose                          | Required? |
      |-------------|------------------|----------------------------------|-----------|
      | open_comment | string           | reason for request               | yes      |

* `/requests/all/`
  * GET: get all requests in the system
    * Permissions: must be a manager
    * Query params:

      | Parameter   | Type             | Purpose                          | Required? |
      |-------------|------------------|----------------------------------|-----------|
      | status      | string           | Filter by status (Outstanding, Approved, or Denied) | no       |
     
* `/requests/[request_pk]/`
  * GET: get the request with the specified id (request_pk)
    * Permissions:  
      * Admin: can get any request
      * User: can only get own requests

  * PUT: approve or deny the request with the specified id (request_pk)
    * Permissions: must be an admin
    * Parameters: 

      | Parameter     | Type             | Purpose                                    | Required? |
      |-------------  |------------------|----------------------------------          |-----------|
      | requested_items      | list of dictionaries | the items in the cart - can modify quantity and request_type         | no        |
      | status        | string           | request status: 'Approved', or 'Denied'    | yes       |
      | closed_comment| string           | reason for approving or denying            | no        |

    * Requested items sample data:
    ```
    [
      {
          "item": "xyz",
          "quantity": 1,
          "request_type": "loan" // or "disbursement"
      }
      {
          "item": "item2",
          "quantity": 3,
          "request_type": "disbursement" // or "loan"
      }
    ]
    ```


  * DELETE: delete (cancel) the request with the specified id (request.pk)
    * Permissions: must be the request owner
    * Request must be outstanding
* `/requests/all/`
  * GET: get all requests
    * Permissions: must be an admin

#### Subject Tag
* `/subjecttag/`
  * GET: get the global subject tag
    * default is [kipventory]
  * PUT: modify the subject tag
    * Sample data:
    ```
    {
      "text": "string"
    }
    ```

#### Tags
* `/tags/`
  * GET: get all tags in the database
  * POST: add a tag
    * Sample data: 
      ```
      {
        "name": "string"
      }
      ```
* `/tags/{tag_name}`
  * DELETE: delete a tag with name tag_name

#### Transactions
* Note: this is named poorly because of a miscommunication in a previous evolution about what a transaction was. This endpoint retrieves any registered Acquisitions or Losses of items. This may be renamed in a future release.
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

#### Users
* `/users/`
  * GET: get all users
    * Permissions: must be an admin
* `/users/create/`
  * POST: create a new local user (non-netid)
    * Permissions: must be an admin
    * Sample POST data:
      *  
      ```
      {
        "username": "string",
        "first_name": "string",
        "last_name": "string",
        "password": "string",
        "email": "string",
        "is_staff": true,
        "is_superuser": true,
      }
      ```
* `/users/current/`
  * GET: get the current user
*`/api/users/edit/{username}/`
  * PUT: edit the user with username `username`
    * Permissions: 
      * must be an admin to change privilege (is_superuser, is_staff)
      * must be a manager to change profile.subscribed
    * Cannot change username to a netid (or else that netid could not log in for the first time)
    * Sample PUT data:

    ```
    {
      "username": "string",
      "first_name": "string",
      "last_name": "string",
      "password": "string",
      "email": "string",
      "is_staff": true,
      "is_superuser": true,
      "profile": {
        "subscribed": false
      },
    }
    ```
* `/api/users/managers/subscribed/`
  * GET: get all subscribed managers



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
