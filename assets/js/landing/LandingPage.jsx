import React from 'react'
import { Jumbotron, Row, Col, Grid, Well } from 'react-bootstrap'

import LoginSignupContainer from './login/LoginSignupContainer'

var LandingPage = React.createClass({
  getInitialState() {
    return {}
  },

  getLoginRedirectMessage() {
    var node = document.getElementById('not-authenticated')
    if (node == null) {
      return
    }
    return (
      <Row>
        <Col xs={8} xsOffset={2} md={4} mdOffset={4}>
          <Well>You must log in to see that page.</Well>
        </Col>
      </Row>
    )
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Jumbotron>
              <Row>
                <h1>kip-ventory</h1>
              </Row>
              <Row>
                <p>Your one-stop-shop for any hardware-related needs!</p>
              </Row>
            </Jumbotron>
          </Col>
        </Row>
        {this.getLoginRedirectMessage()}
          <Col xs={8} xsOffset={2} md={4} mdOffset={4}>
            <LoginSignupContainer next={this.props.location.query.next}/>
          </Col>
      </Grid>
    );
  }
});


export default LandingPage;
