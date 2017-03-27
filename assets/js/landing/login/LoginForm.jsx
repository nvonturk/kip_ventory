import React from 'react'
import {Form, FormGroup, Col, FormControl, Checkbox, Button, ControlLabel, } from 'react-bootstrap'
import {ajax} from 'jquery'

import { CSRFToken, getCookie } from '../../csrf/DjangoCSRFToken'

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
    var identity = "client_id=ece458kipventory";
    var redirect = "redirect_uri=https://colab-sbx-277.oit.duke.edu/api/netidtoken/";
    var urlstate = "state=11291";
    var netid_url = "https://oauth.oit.duke.edu/oauth/authorize.php?response_type=code"+"&"+identity+"&"+redirect+"&"+scope+"&"+urlstate;


    return (
      <div>
        <form method="post" action="/api/login/">
          <CSRFToken />
          <FormGroup bsSize="small" controlId="username">
            <FormControl type="text" value={this.state.username} name="username" placeholder="Username" onChange={this.handleChange} />
          </FormGroup>

          <FormGroup bsSize="small" controlId="password">
            <FormControl type="password" value={this.state.password} name="password" placeholder="Password" onChange={this.handleChange} />
          </FormGroup>

          <input type="hidden" name="next" value={this.props.next} />

          <FormGroup bsSize="small">
            <Button block bsSize="small" type="submit">
              Sign in
            </Button>
          </FormGroup>
        </form>


        <form>
          <CSRFToken />
          <FormGroup controlId="netid">
            <Button block style={{color: "#df691a"}} bsSize="small" onClick={e => {window.location.assign(netid_url)}}>
              Login with Duke NetID
            </Button>
          </FormGroup>
        </form>
      </div>
    );
  }
});


export default LoginForm;
