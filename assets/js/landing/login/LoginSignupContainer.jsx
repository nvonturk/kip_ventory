import React from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

import {Row, Col, Button, Panel, Well, Nav, NavItem} from 'react-bootstrap';



const LoginSignupContainer = React.createClass({
  getInitialState() {
    return {
      activeKey: 1
    }
  },

  handleSelect(selectedKey) {
    this.setState({
      activeKey: selectedKey
    })
  },

  getPanelHeader() {
    return (
      <Nav bsStyle="pills" justified activeKey={this.state.activeKey} onSelect={this.handleSelect}>
          <NavItem eventKey={1} title="login">Login</NavItem>
          <NavItem eventKey={2} title="signup">Signup</NavItem>
        </Nav>
    )
  },

  getPanelContent() {
    var showLogin = (this.state.activeKey == 1);
    var elems = []
    var node = document.getElementById('invalid-login-credentials')
    if (node != null && showLogin) {
      elems.push(<Well id="login-error-message" key={1}>Your username or password was incorrect - try again.</Well>)
    }
    elems.push(showLogin ? <LoginForm key={2}/> : <SignupForm key={2}/>)
    return (<div>{elems}</div>)
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
