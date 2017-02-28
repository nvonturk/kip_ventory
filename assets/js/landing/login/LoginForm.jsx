import React from 'react'
import {Form, FormGroup, Col, FormControl, Checkbox, Button, ControlLabel, } from 'react-bootstrap'
// import { Router, Route, browserHistory, IndexRoute } from 'react-router'


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
    var scope = "scope=basic%20identity:netid:read";
    var identity = "client_id=kipventory";
    // var redirect = "redirect_uri=https://colab-sbx-277.oit.duke.edu/api/netidtoken/";
    var redirect = "redirect_uri=http://127.0.0.1:8000/api/netidtoken/";
    var urlstate = "state=11291";
    var netid_url = "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code"+"&"+identity+"&"+redirect+"&"+scope+"&"+urlstate;


    return (
      <div>
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


        <form>
          <CSRFToken />
          <FormGroup controlId="netid">
            <Button block>
              <a href={netid_url}> Login with Duke NetID</a>
            </Button>
          </FormGroup>
        </form>
      </div>
    );
  }
});


export default LoginForm;
