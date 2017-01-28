import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'


import LoginForm from './loginform'


render((
  <Router history={browserHistory}>
    <Route path="/" component={LoginForm} />
  </Router>
), document.getElementById('root'))
