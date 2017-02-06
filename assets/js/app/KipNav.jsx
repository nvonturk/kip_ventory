import React from 'react'
import { Link, browserHistory } from 'react-router'
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap';

const KipNav = React.createClass({

  goToURL: url => event => {
    event.preventDefault();
    window.location.assign(url);
  },

  getAdminLink() {
    return this.props.route.user.is_staff ? (
      <LinkContainer to="/app/admin/">
        <NavItem eventKey={3}>Admin</NavItem>
      </LinkContainer>
    ) : null;
  },

  render() {
    return (
      <div id="container">
        <Navbar staticTop collapseOnSelect inverse>
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
              {this.getAdminLink()}
            </Nav>
            <Nav pullRight>
              <LinkContainer to="/app/cart/">
                <NavItem eventKey={2}>Cart</NavItem>
              </LinkContainer>
              <LinkContainer to="/app/profile/">
                <NavItem eventKey={3}>Profile</NavItem>
              </LinkContainer>
              <NavItem eventKey={4} onClick={this.goToURL("/api/logout/")}>Logout</NavItem>
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
