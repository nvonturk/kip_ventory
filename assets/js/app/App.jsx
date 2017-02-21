import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import KipNav from './KipNav'
import Home from './Home'

// ADMIN PAGES
import AdminContainer from './admin/AdminContainer'
import AdminWelcome from './admin/welcome/AdminWelcome'
import DisbursementContainer from './admin/disbursement/DisbursementContainer'
import AdminRequestsContainer from './admin/requests/AdminRequestsContainer'
import TransactionsContainer from './admin/transactions/TransactionsContainer'
import NewUserRequestsContainer from './admin/newuserrequests/NewUserRequestsContainer'
import GenerateAPITokenContainer from './admin/apitoken/GenerateAPITokenContainer'

import ManagerContainer from './manage/ManagerContainer'
import ManagerWelcome from './manage/welcome/ManagerWelcome'
import DisbursementContainer from './manage/disbursement/DisbursementContainer'
import AdminRequestsContainer from './manage/requests/ManagerRequestsContainer'
import TransactionsContainer from './manage/transactions/TransactionsContainer'
import NewUserRequestsContainer from './manage/newuserrequests/NewUserRequestsContainer'

// MAIN APP PAGES
import CartContainer from './cart/CartContainer'
import RequestListContainer from './requests/RequestListContainer'
import Profile from './Profile'
import {getJSON} from 'jquery'


function getManagerPanel(userData) {
  return userData.is_staff ? (
    <Route path="manage" component={ManagerContainer} admin={userData}>
      <IndexRoute component={ManagerWelcome} admin={userData} />
      <Route path="disburse" component={DisbursementContainer} admin={userData} />
      <Route path="requests" component={AdminRequestsContainer} admin={userData} />
      <Route path="transactions" component={TransactionsContainer} admin={userData} />
      <Route path="newuserrequests" component={NewUserRequestsContainer} admin={userData} />
      <Route path="generateapitoken" component={GenerateAPITokenContainer} admin={userData} />
    </Route>) : null
}

function getAdminPanel(userData) {
  return userData.is_superuser ? (
    <Route path="admin" component={AdminContainer} admin={userData}>
    </Route>) : null
}

function initialize(userData) {
  render((
    <Router history={browserHistory}>
      <Route path="app" component={KipNav} user={userData}>
        <IndexRoute component={Home} user={userData} />
        <Route path="requests" component={RequestListContainer} user={userData}/>
        <Route path="cart" component={CartContainer} user={userData} />
        <Route path="profile" component={Profile} user={userData} />
        {getManagerPanel(userData)}
        {getAdminPanel(userData)}
      </Route>
    </Router>),
    document.getElementById('root'));
}


getJSON("/api/users/current/", function(data) {
   var user = data
   initialize(user)
})
