import React from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

import {Row, Col, Button, Panel} from 'react-bootstrap';



const LoginSignupContainer = React.createClass({
  getInitialState() {
    return {
      "showLogin": true
    }
  },

  getPanelHeader() {
    return (
      <Row>
        <Col xs={6}>
          <Button bsSize="large" block onClick={e => this.setState({showLogin: true})}>Login</Button>
        </Col>
        <Col xs={6}>
          <Button bsSize="large" block onClick={e => this.setState({showLogin: false})}>Sign Up</Button>
        </Col>
      </Row>
    )
  },

  getPanelContent() {
    var showLogin = this.state.showLogin;
    return showLogin ? <LoginForm /> : <SignupForm />
  },

  render() {
    return (
      <div id="login-signup">
        <Row>
          <Col xs={10} xsOffset={1} sm={10} smOffset={1} md={4} mdOffset={4} lg={4} lgOffset={4}>
            <Panel header={this.getPanelHeader()}>
              {this.getPanelContent()}
            </Panel>
          </Col>
        </Row>
      </div>
    );
  }
});

export default LoginSignupContainer;
