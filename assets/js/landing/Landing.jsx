
import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory, IndexRoute } from 'react-router'

import LandingPageContainer from './LandingPageContainer'
import LandingPage from './LandingPage'
import LoginSignupContainer from './login/LoginSignupContainer'

render((
  <Router history={browserHistory}>

    <Route path="/" component={LandingPageContainer}>
      <IndexRoute component={LandingPage} />
      <Route path="login" component={LoginSignupContainer} />
    </Route>

  </Router>
), document.getElementById('root'))
