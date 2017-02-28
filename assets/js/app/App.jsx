import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import KipNav from './KipNav'
// import Home from './Home'

// ADMIN PAGES
import ManagerContainer from './manage/ManagerContainer'
import ManagerWelcome from './manage/welcome/ManagerWelcome'
import ItemCreationForm from './manage/items/ItemCreationForm'
import CustomFieldContainer from './manage/customfields/CustomFieldContainer'
import DisbursementContainer from './manage/disbursement/DisbursementContainer'
import ManagerRequestsContainer from './manage/requests/ManagerRequestsContainer'
import TransactionsContainer from './manage/transactions/TransactionsContainer'
import NewUserRequestsContainer from './manage/newuserrequests/NewUserRequestsContainer'
import LogsContainer from './manage/logs/LogsContainer'
import TagsContainer from './manage/tags/TagsContainer'

// MAIN APP PAGES
import InventoryContainer from './inventory/InventoryContainer'
import CartContainer from './cart/CartContainer'
import RequestsContainer from './requests/RequestsContainer'
import Profile from './Profile'
import {getJSON} from 'jquery'

import ItemDetail from './inventory/ItemDetail'
import RequestDetail from './requests/RequestDetail'

function getManagerPanel(userData) {
  const custom_field_route = userData.is_superuser ? (<Route path="custom-fields" component={CustomFieldContainer} admin={userData} />) : null;

  return userData.is_staff ? (
    <Route path="manage" component={ManagerContainer} admin={userData}>
      <IndexRoute component={ManagerWelcome} admin={userData} />
      <Route path="create-item" component={ItemCreationForm} admin={userData} />
      {custom_field_route}}
      <Route path="disburse" component={DisbursementContainer} admin={userData} />
      <Route path="requests" component={ManagerRequestsContainer} admin={userData} />
      <Route path="transactions" component={TransactionsContainer} admin={userData} />
      <Route path="logs" component={LogsContainer} admin={userData} />
      <Route path="tags" component={TagsContainer} admin={userData} />
      <Route path="newuserrequests" component={NewUserRequestsContainer} admin={userData} />
    </Route>) : null
}


function initialize(userData) {
  render((
    <Router history={browserHistory}>
      <Route path="app" component={KipNav} user={userData}>
        <IndexRoute component={InventoryContainer} user={userData} />
        <Route path="items/:item_name" component={ItemDetail} user={userData} />
        <Route path="requests" component={RequestsContainer} user={userData}/>
        <Route path="requests/:request_id" component={RequestDetail} user={userData} />
        <Route path="cart" component={CartContainer} user={userData} />
        <Route path="profile" component={Profile} user={userData} />
        {getManagerPanel(userData)}
      </Route>
    </Router>),
    document.getElementById('root'));
}


getJSON("/api/users/current/", function(data) {
   var user = data
   initialize(user)
})
