import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'

import KipNav from './kipnav'
import Home from './home'
import Requests from './requests'
import Profile from './profile'

render((
  <Router history={browserHistory}>
    <Route path="app" component={KipNav}>
      <IndexRoute component={Home} />
      <Route path="requests" component={Requests} />
      <Route path="profile" component={Profile} />
    </Route>
  </Router>
), document.getElementById('root'))
