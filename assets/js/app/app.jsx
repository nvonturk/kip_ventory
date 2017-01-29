import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'

import KipNav from './kipnav'
import Home from './home'
import Requests from './requests'
import Profile from './profile'

import LoginForm from './login/loginform'
import LoginContainer from './login/logincontainer'

import ApplicationContainer from './applicationcontainer'



render((
  <Router history={browserHistory}>

    <Route path="/" component={ApplicationContainer}>

      <Route path="login" component={LoginContainer}>
        <IndexRoute component={LoginForm} />
      </Route>

      <Route path="app" component={KipNav}>
        <IndexRoute component={Home} />
        <Route path="requests" component={Requests} />
        <Route path="profile" component={Profile} />
      </Route>

    </Route>
  </Router>
), document.getElementById('root'))
