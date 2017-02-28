import React from 'react'
import { Link, browserHistory } from 'react-router'
import { Grid, Row, Col, Navbar, Nav, NavItem, NavDropdown, MenuItem } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap';

const KipNav = React.createClass({

  goToURL: url => event => {
    event.preventDefault();
    window.location.assign(url);
  },

  getManagerLink() {
    return this.props.route.user.is_staff ? (
      <LinkContainer to="/app/manage/">
        <NavItem eventKey={5}>Manage</NavItem>
      </LinkContainer>
    ) : null;
  },

  getAdminLink() {
    return this.props.route.user.is_superuser ? (
      <LinkContainer to="/admin/">
        <NavItem onClick={this.goToURL("/admin/")} eventKey={6}>Admin</NavItem>
      </LinkContainer>
    ) : null;
  },

  getSwaggerLink(){
    return  (
      <LinkContainer to="/admin/">
        <NavItem onClick={this.goToURL("/swagger/")} eventKey={7}>API Test</NavItem>
      </LinkContainer>
    );
  },

  render() {
    return (
      <div>
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
              {this.getManagerLink()}
              {this.getAdminLink()}
            </Nav>
            <Nav pullRight>
              <LinkContainer to="/app/cart/">
                <NavItem eventKey={2}>Cart</NavItem>
              </LinkContainer>
              <LinkContainer to="/app/profile/">
                <NavItem eventKey={3}>Profile</NavItem>
              </LinkContainer>
              {this.getSwaggerLink()}
              <NavItem eventKey={4} onClick={this.goToURL("/api/logout/")}>Logout</NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Grid>
          <Row>
            <Col sm={12}>
              {this.props.children}
            </Col>
          </Row>
        </Grid>
      </div>
    );
  }
})

export default KipNav;
