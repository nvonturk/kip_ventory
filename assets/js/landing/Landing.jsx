
import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'

import LandingPage from './LandingPage'
import LoginSignupContainer from './login/LoginSignupContainer'

render((
  <Router history={browserHistory}>

    <Route path="/">
      <IndexRoute component={LandingPage} />
    </Route>

  </Router>
), document.getElementById('root'))
