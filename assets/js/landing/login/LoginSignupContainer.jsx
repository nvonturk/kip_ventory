import React from 'react';
import LoginForm from './LoginForm';

import {Grid, Row, Col, Button, Panel, Well, Nav, NavItem} from 'react-bootstrap';

const LoginSignupContainer = React.createClass({
  getInitialState() {
    return {}
  },

  getLoginRedirectMessage() {
    var node = document.getElementById('not-authenticated')
    return (node != null) ? (
      <Well bsSize="small" className="text-center" style={{fontSize:"12px"}}>
        You must log in to see that page.
      </Well>
    ): null
  },

  getInvalidLoginMessage() {
    var node = document.getElementById('invalid-login-credentials')
    return (node != null) ? (
      <Well bsSize="small" className="text-center" style={{fontSize:"12px"}}>
        Your username or password was incorrect.
      </Well>
    ): null
  },

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col md={8} mdOffset={2} xs={10} xsOffset={1}>
            <Col md={4} mdOffset={4} xs={12}>
              { this.getLoginRedirectMessage() }
              { this.getInvalidLoginMessage() }
              <LoginForm next={this.props.next}/>
            </Col>
          </Col>
        </Row>
      </Grid>
    );
  }
});

export default LoginSignupContainer;
