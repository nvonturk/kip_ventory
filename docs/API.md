API Documentation
=================

This document details how to interact with the REST API via HTTP methods.


REST Endpoints
------------

The following is a list of all REST endpoints in the web app. All endpoints are relative to `https://colab-sbx-277.oit.duke.edu/api/`. Under each endpoint, the available actions are listed. If an action is not listed, it is not supported by the API. If permissions are not listed, any user can access that endpoint. If parameters are not listed, no data needs to be included with the HTTP request.

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
* `/apitoken/`
  * GET: get an API token (must be logged in via application interface)

#### Assets
* `/assets/{asset_tag}`
  * GET: get an asset object with the asset tag `asset_tag`

#### Backfill requests
* `/backfillrequests/{id}`
  * GET: get the backfill requests with the specified id
    * Permissions: managers see all backfill requests, users only see their own backfill requests
  * DELETE: delete the backfill request with the specified id
    * Permissions: all users can only delete (cancel) their own, outstanding, backfill requests
  * PUT: approve or deny a request
    * Permissions: managers only, and can only change outstanding backfill requests
    * on approval, a backfill is created and the loan is converted to a disbursement

    | Parameter | Type   | Purpose                                | Required? |
    |-----------|--------|----------------------------------------|-----------|
    | status    | string | approve ("A") or deny ("D")            | yes       |
    | admin_comment   | string | optional comment          | no     |


#### Backfills
* `/backfills/{id}`
  * GET: get the backfill with the specified id
    * Permissions: managers see all backfills, users only see their own backfills
  * PUT: change status of backfill to satisfied
    * Permissions: managers only, and can only change backfills with status "awaiting items"

    | Parameter | Type   | Purpose                                | Required? |
    |-----------|--------|----------------------------------------|-----------|
    | status    | string | mark backfill as "satisfied"            | yes       |


#### Backup Email
* `/backupemail/`
  * GET: initiate the sending of emails to administrative users notifying of backup results

  | Parameter | Type   | Purpose                                | Required? |
  |-----------|--------|----------------------------------------|-----------|
  | status    | string | backup result status (success/failure) | yes       |

#### Cart
* `/cart/`
  * GET: get the cart for the logged in user
* `/cart/{item_name}`
  * GET: get the number of a specified item in the user's cart
  * DELETE: delete a specified item from the user's cart
  * PUT: modify quantity of item in user's cart or whether item is requested for loan/disbursement

  | Parameter    | Type   | Purpose                                              | Required? |
  |--------------|--------|------------------------------------------------------|-----------|
  | quantity     | string | number of item to be requested                       | yes       |
  | request type | string | specify whether request will be loan or disbursement | yes       |

#### Disburse
* `/disburse/`
  * POST: create approved disbursals from an admin user to a regular user, logged in user defaults to admin user

  | Parameter      | Type          | Purpose                                                                      | Required? |
  |----------------|---------------|------------------------------------------------------------------------------|-----------|
  | requester      | string        | filter logs by user associated with entries                                  | yes       |
  | items          | string array  | array of item names being disbursed                                          | yes       |
  | types          | string array  | index related to items field, request type (loan/disbursement) for each item | yes       |
  | quantities     | integer array | index related to items field, requested quantity of each item                | yes       |
  | closed_comment | string        | administrator comment explaining action                                      | yes       |
  | open_comment   | string        | comment on opening of requests                                               | yes       |
  | assets         | string array  | specify which assets to loan/disburse                                        | if [items] is asset-tracked |

#### Fields
* `/fields/`
  * GET: get all custom fields in system
  * POST: create a new custom field

  | Parameter  | Type    | Purpose                                                   | Required? |
  |------------|---------|-----------------------------------------------------------|-----------|
  | private    | boolean | whether or not field is hidden to non-admin/manager users | yes       |
  | name       | string  | the name of the custom field                              | yes       |
  | field_type | string  | one of four custom field types (Single/Multi/Float/Int)   | yes       |
  | asset_tracked | string  | whether this custom field is also applied to individual assets   | yes       |

* `/fields/{field_name}`
  * DELETE: delete a specified custom field
  * GET: get the information associated with a specified custom field

#### Import
* `/import/`
  * POST: initiate a bulk import, a files is included with this request

  | Parameter     | Type   | Purpose                         | Required? |
  |---------------|--------|---------------------------------|-----------|
  | administrator | string | administrator initiating import | yes       |

* `/import/tempalte/`
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
  | has_assets  | boolean          | whether this item is asset-tracked|yes       |

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
  | has_assets  | boolean          | whether this item is asset-tracked|yes       |


* `/items/{item_name}/addtocart`
  * POST: add an item to the logged in user's cart.

  | Parameter    | Type             | Purpose                                                     | Required? |
  |--------------|------------------|-------------------------------------------------------------|-----------|
  | quantity     | positive integer | number of items requested                                   | yes       |
  | request type | string           | delineates whether item is request for loan or disbursement | yes       |

* `/items/{item_name}/assets/`
  * GET: get all assets associated with object with name `{item_name}`

  | Parameter    | Type             | Purpose                                                     | Required? |
  |--------------|------------------|-------------------------------------------------------------|-----------|
  | page         | string           | page number for paginated assets                            | no        |
  | itemsPerPage | string           | number of items in each paginated query of assets           | no        |

* `/items/{item_name}/assets/{asset_tag}`
  * GET: get all asset with tag `asset_tag` associated with object with name `{item_name}`
  * PUT: change the value of asset fields with current tag `{asset_tag}` associated with object with and  `{item_name}`  
  | Parameter | Type    | Purpose                    | Required? |
  |-----------|---------|----------------------------|-----------|
  | location  | string  | physical location of asset | no        |
  | tag       | integer | new integer tag of asset   | yes       |


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
  | status    | string | filter by loan status (outstanding, returned)    | no        |

* `/items/{item_name}/requests`
  * GET: get all requests associated with an item

  | Parameter | Type   | Purpose                         | Required? |
  |-----------|--------|---------------------------------|-----------|
  | type      | string | filter requests by request type | no        |
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

* `/loans/{id}/requestforbackfill/`
  * POST: request a loan for backfill
    * Permissions: user must own the loan
    * Sample data
    ```
    {
      "requester_comment": string, 
      "receipt" : file
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
      | approved_items      | list of dictionaries | the items in the cart - can modify item, quantity, request_type, and assets         | yes        |
      | status        | string           | request status: 'Approved', or 'Denied'    | yes       |
      | closed_comment| string           | reason for approving or denying            | no        |

    * Approved items sample data:
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
          "request_type": "disbursement" // or "loan",
          "assets": ["1", "2", "3"] // list of asset tags - length must equal quantity
      }
    ]
    ```


  * DELETE: delete (cancel) the request with the specified id (request.pk)
    * Permissions: must be the request owner
    * Request must be outstanding
* `/requests/all/`
  * GET: get all requests
    * Permissions: must be an admin

* `/requests/[request_pk]/backfills/`
  * GET: get all backfills, grouped by request

* `/requests/[request_pk]/backfills/requests/`
  * GET: get all backfill requests, grouped by request

* `/requests/[request_pk]/loans/`
  * GET: get all loans, grouped by request

* `/requests/[request_pk]/disbursements/`
  * GET: get all disbursements, grouped by request

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
      | assets        | string array      | List of asset tags to mark as lost          | if category is "loss" and specified item has assets        |

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
