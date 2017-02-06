import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'
import KipNav from './KipNav'
import Home from './Home'
// import Requests from './Requests'
import RequestListContainer from './requests/RequestListContainer'
import RequestContainer from './requests/RequestContainer'
import AdminRequestsContainer from './admin/adminrequestscontainer'
import Profile from './Profile'
import CartContainer from './cart/CartContainer'
import {getJSON} from 'jquery'


function getAdminRouteIfAdmin(userData) {
  return userData.is_staff ? <Route path="admin" component={AdminRequestsContainer} user={userData}/> : null
}

function initialize(userData) {
  render((
    <Router history={browserHistory}>
      <Route path="app" component={KipNav} user={userData}>
        <IndexRoute component={Home} user={userData} />
        <Route path="requests" component={RequestListContainer} user={userData}>
          <Route path=":requestid" component={RequestContainer} user={userData} />
        </Route>
        <Route path="profile" component={Profile} user={userData} />
        <Route path="cart" component={CartContainer} user={userData} />
        {getAdminRouteIfAdmin(userData)}
      </Route>
    </Router>),
    document.getElementById('root'));
}


getJSON("/api/users/current/.json", function(data) {
   var user = data
   initialize(user)
})
