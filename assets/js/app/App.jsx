import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import KipNav from './KipNav'
import Home from './Home'

import AdminContainer from './admin/AdminContainer'
import DisbursementContainer from './admin/disbursement/DisbursementContainer'
import AdminRequestsContainer from './admin/requests/AdminRequestsContainer'
import TransactionsContainer from './admin/transactions/TransactionsContainer'
import LogsContainer from './admin/logs/LogsContainer'

import CartContainer from './cart/CartContainer'
import RequestListContainer from './requests/RequestListContainer'
import Profile from './Profile'
import {getJSON} from 'jquery'


function getRouteIfAdmin(userData) {
  return userData.is_staff ? (
    <Route path="admin" component={AdminContainer} admin={userData}>
      <Route path="disburse" component={DisbursementContainer} admin={userData} />
      <Route path="requests" component={AdminRequestsContainer} admin={userData} />
      <Route path="transactions" component={TransactionsContainer} admin={userData} />
      <Route path="logs" component={LogsContainer} admin={userData} />
    </Route>) : null
}

function initialize(userData) {
  render((
    <Router history={browserHistory}>
      <Route path="app" component={KipNav} user={userData}>
        <IndexRoute component={Home} user={userData} />
        <Route path="requests" component={RequestListContainer} user={userData}/>
        <Route path="profile" component={Profile} user={userData} />
        <Route path="cart" component={CartContainer} user={userData} />
        {getRouteIfAdmin(userData)}
      </Route>
    </Router>),
    document.getElementById('root'));
}


getJSON("/api/users/current/.json", function(data) {
   var user = data
   initialize(user)
})
