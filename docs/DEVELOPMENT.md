Developer Guide
========

This document will specify the location of key components of our application,
layout the subsystems within the application (and how they interact with each other),
and specify how to go about extending the system with additional functionality.

In addition, this guide will serve as the main resource for troubleshooting various
components of the system.

## Configuring a Build Environment
We use python with Django, Django REST Framework, and several 3rd party libraries. To configure a build environment, go ahead and clone the repository at `https://github.com/nbv3/kip_ventory.git`. From there, set up a new Python 3 virtual environment and install our dependencies.

`python3 -m venv env`

`source env/bin/activate`

`pip install -r requirements.txt`

Next, install the `npm` dependencies. These are required for the front-end javascript in our application.

`npm install`

We use `webpack` to transpile and bundle our React ES2015 code. In a separate terminal, run the following command.

`npm run dev`

This command will ensure that `webpack` detects any changes to the javascript files in `/assets/js/` and recompiles the entire front end, placing them in the `/build/` directory (where they are served by Django).

Finally, run

`python kipventory/manage.py runserver`

to start the system for local development.

Note that our front end code lives in the `/assets/js/` directory, and is separated into `app` and `landing` subdirectories, respectively. The `app` directory contains the front end files for our single-page application. The `landing` directory contains the files used to build our landing/login page (which we have kept separate from our password-protected application).

Consult the deployment guide (`DEPLOYMENT.md`) for detailed setup of the production machine.

## System Overview

The application follows the standard Django folder layout - however, we have chosen to use Django alongside a 3rd-party library called the Django REST Framework to implement a RESTful JSON-only API. This API is the core of the system, and encompasses all functionality set forth in the requirements.

The general project structure is as follows (note that only major files have been included - these files contain the majority of the system logic).

```
kipventory/
  api/
    urls.py
    models.py
    crons.py
    views.py
    serializers.py

  kipventory/
    urls.py
    celery.py
    settings.py
    views.py

  static/
    css/
      *** all CSS files ***
    fonts/
      *** all font files ***

  templates/
    kipventory/
      app.html
      landing.html

  build/
    *** output of compiled JS ***
```

In accordance with the standard Django layout, project-level configurations and initial URL routing is contained in the `/kipventory/` folder, detailed below.

## `/kipventory/`

This folder contains 4 main files, each of which is detailed below.

#### `urls.py`

`kipventory/urls.py` contains the global URL route table for our application. There are only 7 routes in this file, all of which represent non-API specific endpoints (such as the landing page, login/logout endpoints, our API testing tool [Swagger], our front-end single-page-application (`/app/`), and our global media and static files.

This `urls.py` file is configured to pass any URL beginning with `/api/` to the `/api/urls.py` file, which contains our API-specific routes.

#### `celery.py`

This file configures our distributed task manager, `celery`, which we use to handle asynchronous sending of emails from the system. This file will likely not need to be changed, but if it is, please consult the Django-Celery and Celery documentation.

#### `settings.py`

This file configures the global Django settings for the system, and is extremely important. Changes to this file should be made sparingly, and should not be changed on production unless absolutely crucial.

#### `views.py`

This file contains the logic for the system-wide views. Because we are using Django to serve a single-page application, we only have two views. The first view returns the basic HTML page for our landing page - this represents the entry point into the single-page application, and presents the user with a login form.

The second route is password-protected, and returns the single-page application itself. These are the only two global views that we have configured, as the rest is handled via client-side routing in our React single-page application.


## `/api/`
Our core API functionality lives in the `/api/` folder. This folder contains 5 key files, which are detailed below.

#### `models.py`

This file defines the underlying database models and schema for our application, and is used to create database migrations, establish relations between models, and lay out the basic data format of the system. Consult the Django `models` documentation for further reference.

Note that any changes to this file will likely result in database migrations, and should not be made lightly. If `models.py` is altered, ensure that your database has been migrated to reflect the new schema.

#### `serializers.py`

This file is specific to the Django REST Framework. `serializers.py` contains classes that are used to parse and convert each backend database model to and from a serializable JSON representation. As such, this file is crucial to the core functionality of the API.

Each serializer contains several methods which may be overwritten to provide custom functionality.

###### Serializer Methods
* `to_internal_value(self, data)` - This function takes raw data in JSON format and converts it to the underlying data types associated with the model.
* `to_representation(self, instance)` - This method takes an underlying data model instance and converts it to a JSON-serialized representation.
* `validate(self, data)` - This method is responsible for any custom validation that might need to occur before making modifications to the database objects affected by this API call. Returns a dictionary of valid data values.
* `create(self, validated_data)` - This method takes the validated data and creates a new instance of the underlying database model.
* `update(self, instance, validated_data)` - This method is responsible for updating the fields on an existing database model instance to the new values present in the `validated_data` dictionary.

Consult the Django REST Framework - Serializers documentation for more information.

If new models are added (which are accessible via the API) then a new serializer class should be written to handle the API's interaction with the model.

#### `urls.py`

Similar to in the `/kipventory/` folder, this `urls.py` file contains all routing for API endpoints in our application. If any new API endpoints are added, they will have to be configured in `/api/urls.py`.

#### `views.py`

This file contains the entirety of the API functionality of the system. We use Django REST Framework Generic Views to provide a standard, class-based interface to define view functions. These functions communicate solely via JSON data - that is, any data sent back and forth is required to be in JSON format. Most views are simple, and follow the standard CRUD specification. However, more complex views contain their own custom logic.

To add a new API endpoint, a new view class will need to be written and linked with a route in `urls.py`. Additionally, if the new endpoint interacts with a new database model, then the corresponding serializer class should be specified with the `get_serializer_class(self)` method, which returns the basic serializer for the underlying data model.

#### `crons.py`

This file contains the `cron` configuration used to automate the sending of emails to users and managers. It is unlikely this file will need to be changed, but if it is, consult the documentation for the `django-cron` library.


## React Single-Page Application

The basic structure of the React single-page application is laid out in the `/assets/js/app/App.jsx` file. We use a library called `react-router` to handle all client-side URL routing. The front-end routes for our application can be found in `App.jsx`. Note that some routes are permission protected - if you need to limit permission to a certain page (for instance, a settings page that only admins may access), consult the existing examples in `App.jsx`.

We have opted to use raw React for our front end (without Redux or another state management library)

#### Adding a new front-end page

In order to add a new page to the front end, first, configure a new route in `App.jsx`. This should be fairly straightforward, and you may consult the existing routes for guidance.

Next, write your React components. We have tried to compartmentalize our front-end code to adhere to DRY principles and promote re-use wherever possible. In keeping with that tradition, you should attempt to abstract as much of the new code as possible into self-contained, parametrized classes. This will make maintenance and new development much easier, and adheres to React best practices.

Since we are using React to consume our front-end API, error handling is a large part of creating a responsive UI. Please ensure that for all pages that interact with the API in meaningful ways (ie. POSTing or PUTing data), the relevant `ajax` calls have robust error handling and error reporting. For an example of form-based error handling, please see the `createItem` method of `/assets/js/app/inventory/InventoryContainer.jsx`. Note that in the event of a JSON error response from the API, we conditionally render an error message in the UI to alert users as to the exact error that occurred.

#### Testing the front-end

After constructing a new page, your work is not done. Try your best to break the page - enter invalid data, manually try edge cases, and investigate how the UI responds. The goal is usability and clarity, and every new page should be thoroughly tested for breaking issues before being incorporated. Please also abide by the general style of the front end (for cohesiveness and unity).


## Model Schema

#### User
```
id         --> IntegerField (Alias of 'pk' field)
username   --> CharField
email      --> EmailField
first_name --> CharField
last_name  --> CharField
is_staff   --> BooleanField
profile    --> OneToOneField
```

#### Profile
```
subscribed --> BooleanField    Specifies whether or not this user receives emails from the system (if they are a manager)
```

#### Item
```
id          --> IntegerField (Alias of 'pk' field)
name        --> CharField
model_no    --> CharField
quantity    --> IntegerField --> Non-negative (0 or greater)
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
loans           --> List (reverse relation) --> Lists all loans associated with this request (if request has been approved, empty otherwise)
disbursements   --> List (reverse relation) --> Lists all disbursements associated with this request (if request has been approved, empty otherwise)
```

#### CartItem
```
id          --> IntegerField (Alias of 'pk' field)
item        --> ForeignKey --> Item (each CartItem has one Item)
request_type--> CharField --> One of 'loan' or 'disbursement' - specifies what this item will be requested for.
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
#### Loan
```
id            --> IntegerField (Alias of 'pk' field)
item          --> ForeignKey --> Item (each Loan has one Item)
date_loaned   --> DateTimeField --> Date that this loan was approved (auto-filled)
quantity_loaned --> PositiveIntegerField --> Amount that was loaned to the user
quantity_returned --> PositiveIntegerField --> Number of instances that have been returned from this loan (if quantity_returned == quantity_loaned, then the loan has been returned)
```
#### Disbursement
```
id            --> IntegerField (Alias of 'pk' field)
item          --> ForeignKey --> Item (each Loan has one Item)
date          --> DateTimeField --> Date that this disbursement was approved (auto-filled)
quantity      --> PositiveIntegerField --> Amount that was disbursed to the user

```
Please consult `/api/models.py` for a more detailed overview of all database models and their interactions. Additionally, some models have custom `save()` and `delete()` behavior which is not listed here.

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

#### Login Page (/)

  * When a user first goes to the website, the page gives the option of logging in (if the user already has an account) or signing up for an account. Signing up creates a new User object with the specified fields, and logging in checks the credentials against an existing User in the database. Once signed in, the user is redirected to the main app at /app/.

#### Main app (/app/)

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



#### Admin panel (/admin/)

  * This view is the Django admin panel, where the admin can go to create items and tags and manage many things. Eventually much of this functionality will be moved to the main app.

#### Api (/api/)

  * Our REST api endpoints live at /api. The endpoints are described above, and used in all of our views to make the website interactive and display data.

Configuration
------------

The [readme](https://github.com/nbv3/kip_ventory/blob/docs/README.md) on the kip-ventory github page contains detailed instructions on how to setup and install your own version of the web app.
