import React from 'react'
import { render } from 'react-dom'

import { Well } from 'react-bootstrap'


import LoginSignupContainer from './LoginSignupContainer'


function LoginErrorMessage(props) {
  return (<Well id="login-error-message">Your username or password was incorrect. Try again.</Well>);
}


render(<LoginSignupContainer />, document.getElementById('root'))

var node = document.getElementById('login-error')
if (node != null) {
  render(<LoginErrorMessage />, node)
}
