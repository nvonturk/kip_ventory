import React from 'react'
import {FormGroup, Col, Row, FormControl, Button, ControlLabel } from 'react-bootstrap'

import { CSRFToken } from '../../csrf/DjangoCSRFToken'

// Basic Login Form
const SignupForm = React.createClass({

  getInitialState() {
    return {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
    };
  },

  handleChange(e) {
    var name = e.target.name
    var value = e.target.value
    this.setState({
      [name]: value
    })
  },

  /*
  $('#signup-form').submit(function(event){
    event.preventDefault();
    $.ajax({
      url: $('#signup-form').attr('action'),
      type: post,
      data : $('#signup-form').serialize(),
      success: function(){
        console.log('form submitted.');
      }
    });
  });,
*/

  render() {
    return (
      <div id="signup-form">
        <form method="post" action="/api/signup/">
          <CSRFToken />
          <FormGroup controlId="first_name">
            <ControlLabel>First Name</ControlLabel>
            <FormControl type="text" value={this.state.first_name} name="first_name" placeholder="First" onChange={this.handleChange} />
          </FormGroup>
          <FormGroup controlId="last_name">
            <ControlLabel>Last Name</ControlLabel>
            <FormControl type="text" value={this.state.last_name} name="last_name" placeholder="Last" onChange={this.handleChange} />
          </FormGroup>
          <FormGroup controlId="username">
            <ControlLabel>Username</ControlLabel>
            <FormControl type="text" value={this.state.username} name="username" placeholder="Username" onChange={this.handleChange} />
          </FormGroup>
          <FormGroup controlId="email">
            <ControlLabel>Email</ControlLabel>
            <FormControl type="email" value={this.state.email} name="email" placeholder="Email" onChange={this.handleChange} />
          </FormGroup>
          <FormGroup>
            <Button type="submit" block onClick={e=>console.log(this.state)}>Sign up</Button>
          </FormGroup>
        </form>
      </div>
    )
  }
})

export default SignupForm;
