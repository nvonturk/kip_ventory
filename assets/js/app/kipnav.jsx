import React from 'react'
import { Link, browserHistory } from 'react-router'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap';

const KipNav = React.createClass({

  goToURL: url => event => {
    event.preventDefault();
    window.location.assign(url);
  },

  render() {
    return (
      <div id="container">
        <Navbar collapseOnSelect inverse>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/app">kip-ventory</Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <LinkContainer to="/app/requests/">
                <NavItem eventKey={1}>Requests</NavItem>
              </LinkContainer>
              <LinkContainer to="/app/profile/">
                <NavItem eventKey={2}>Profile</NavItem>
              </LinkContainer>
            </Nav>
            <Nav pullRight>
              <NavItem eventKey={2} onClick={this.goToURL('/logout/')}>Logout</NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div>
          {this.props.children}
        </div>
      </div>
    );
  }
})

export default KipNav;
