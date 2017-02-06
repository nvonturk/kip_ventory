import React from 'react'
import {Form, FormGroup, Col, FormControl, Checkbox, Button, ControlLabel, HelpBlock } from 'react-bootstrap'

import { CSRFToken } from '../../csrf/DjangoCSRFToken'

const LoginForm = React.createClass({

  getInitialState() {
    return {
      username: '',
      password: '',
    };
  },

  handleChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  },

  render() {
    return (
      <form method="post" action="/api/login/">
        <CSRFToken />
        <FormGroup controlId="username">
          <ControlLabel>Username</ControlLabel>
          <FormControl type="text" value={this.state.username} name="username" placeholder="Username" onChange={this.handleChange} />
        </FormGroup>

        <FormGroup controlId="password">
          <ControlLabel>Password</ControlLabel>
          <FormControl type="password" value={this.state.password} name="password" placeholder="Password" onChange={this.handleChange} />
        </FormGroup>

        <FormGroup>
          <Button block type="submit">
            Sign in
          </Button>
        </FormGroup>
      </form>
    );
  }
});


export default LoginForm;
