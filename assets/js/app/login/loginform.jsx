import React from 'react'
import {Form, FormGroup, Col, FormControl, Checkbox, Button, ControlLabel, HelpBlock } from 'react-bootstrap'

const LoginForm = React.createClass({

  getInitialState() {
    return {
      username: '',
      email: '',
      password: '',
      password2: '',
      PasswordError: 0
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

  onSubmit(event) {
    event.preventDefault();

    if (this.state.password != this.state.password2) {
      this.state.PasswordError = 1;
    }
    else {
      this.state.PasswordError = 0;
    }
    var data = {
      username: this.state.username,
      email: this.state.email,
      password: this.state.password,
    }
    this.props.authFunc(data);
  },

  render() {
    return (
      <Form id="login-form" onSubmit={this.onSubmit}>

        <FormGroup controlId="email">
          <ControlLabel>Email</ControlLabel>
          <FormControl type="email" value={this.state.email} name="email" placeholder="Email" onChange={this.handleChange} />
        </FormGroup>

        <FormGroup controlId="username">
          <ControlLabel>Username</ControlLabel>
          <FormControl type="text" value={this.state.username} name="username" placeholder="Username" onChange={this.handleChange} />
        </FormGroup>

        <FormGroup controlId="password">
          <ControlLabel>Password</ControlLabel>
          <FormControl type="password" value={this.state.password} name="password" placeholder="Password" onChange={this.handleChange} />
        </FormGroup>
        <FormGroup controlId="password">
          <ControlLabel>Confirm Password</ControlLabel>
          <FormControl type="password" value={this.state.password2} name="password2" placeholder="Confirm Password" onChange={this.handleChange} />
        </FormGroup>

        <FormGroup>
          <Button type="submit">
            Sign in
          </Button>
        </FormGroup>
      </Form>
    );
  }
});

export default LoginForm;
