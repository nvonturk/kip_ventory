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
        <NavItem eventKey={2}>Manage</NavItem>
      </LinkContainer>
    ) : null;
  },

  getAdminLink() {
    return this.props.route.user.is_superuser ? (
      <LinkContainer to="/app/admin/">
        <NavItem eventKey={3}>Admin</NavItem>
      </LinkContainer>
    ) : null;
  },

  getSwaggerLink(){
    return  (
      <LinkContainer to="/swagger/">
        <NavItem onClick={this.goToURL("/swagger/")} eventKey={6}>API Test</NavItem>
      </LinkContainer>
    );
  },

  getInventoryLink() {
    return (
      <LinkContainer to={"/app/inventory/"}>
        <NavItem eventKey={0}>Inventory</NavItem>
      </LinkContainer>
    )
  },

  getLink(url, key, name) {
    return (
      <LinkContainer to={url}>
        <NavItem eventKey={key}>{name}</NavItem>
      </LinkContainer>
    )
  },

  render() {
    return (
      <div>
        <Navbar staticTop collapseOnSelect inverse>
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/app/inventory/">kip-ventory</Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              {this.getInventoryLink()}
              {this.getLink("/app/requests/", 1, "Your Requests")}
              {this.getManagerLink()}
              {this.getAdminLink()}
            </Nav>
            <Nav pullRight>
              <LinkContainer to="/app/cart/">
                <NavItem eventKey={4}>Cart</NavItem>
              </LinkContainer>
              <LinkContainer to="/app/profile/">
                <NavItem eventKey={5}>Profile</NavItem>
              </LinkContainer>
              {this.getSwaggerLink()}
              <NavItem eventKey={7} onClick={this.goToURL("/api/logout/")}>Logout</NavItem>
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
