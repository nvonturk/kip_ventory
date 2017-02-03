import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'

import KipNav from './KipNav'
import Home from './Home'
import Requests from './Requests'
import Profile from './Profile'

import AppContainer from './AppContainer'
import CartContainer from '../cart/CartContainer'

import LoginSignupContainer from '../login/LoginSignupContainer'

render((
  <Router history={browserHistory}>


    <Route path="app" component={KipNav}>
      <IndexRoute component={Home} />
      <Route path="requests" component={Requests} />
      <Route path="profile" component={Profile} />
      <Route path="cart" component={CartContainer} />
    </Route>

  </Router>
), document.getElementById('root'))
