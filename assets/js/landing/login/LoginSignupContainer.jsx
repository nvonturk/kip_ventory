import React from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

import {Button, Panel, Well, Nav, NavItem} from 'react-bootstrap';



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
        </Nav>
    )
    /*
    return (
      <Nav bsStyle="pills" justified activeKey={this.state.activeKey} onSelect={this.handleSelect}>
          <NavItem eventKey={1} title="login">Login</NavItem>
          <NavItem eventKey={2} title="signup">Signup</NavItem>
        </Nav>
    )
*/
  },

  getPanelContent() {
    var showLogin = (this.state.activeKey == 1);
    var elems = []
    var node = document.getElementById('invalid-login-credentials')
    if (node != null && showLogin) {
      elems.push(<Well id="login-error-message" key={1}>Your username or password was incorrect - try again.</Well>)
    }

    /*
    var node2 = document.getElementById('username-taken')
    if (node2 != null && showLogin) {    //if (node2 != null && !showLogin) {
      elems.push(<Well id="signup-error-message" key={1}>A user already exists with this username.</Well>)
    }
    */

    elems.push(showLogin ? <LoginForm key={2}/> : <SignupForm key={2}/>)
    return (<div>{elems}</div>)
  },

  render() {
    return (
      <div id="login-signup">
        <Panel header={this.getPanelHeader()}>
          {this.getPanelContent()}
        </Panel>
      </div>
    );
  }
});

export default LoginSignupContainer;
