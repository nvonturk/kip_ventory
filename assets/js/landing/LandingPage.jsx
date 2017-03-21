import React from 'react'
import { Jumbotron, Row, Col, Grid, Well } from 'react-bootstrap'

import LoginSignupContainer from './login/LoginSignupContainer'

var LandingPage = React.createClass({
  getInitialState() {
    return {}
  },

  render() {
    return (
      <Grid fluid>

        <Row>
          <Jumbotron>
            <Row>
              <h1>kip-ventory</h1>
            </Row>
            <Row>
              <p>Your one-stop-shop for any hardware-related needs!</p>
            </Row>
          </Jumbotron>
        </Row>

        <Row>
          <Col xs={12}>
            <LoginSignupContainer next={this.props.location.query.next}/>
          </Col>
        </Row>

      </Grid>
    );
  }
});


export default LandingPage;
