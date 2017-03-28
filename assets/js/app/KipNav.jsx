import React from 'react'
import { Link, browserHistory } from 'react-router'
import { Grid, Row, Col, Navbar, Nav, NavItem, NavDropdown, MenuItem, Glyphicon } from 'react-bootstrap'
import { LinkContainer } from 'react-router-bootstrap';

var INDEX = 0

const KipNav = React.createClass({

  goToURL: url => event => {
    event.preventDefault();
    window.location.assign(url);
  },

  getLink(url, name) {
    var i = INDEX
    INDEX = INDEX + 1
    return (
      <LinkContainer to={url}>
        <NavItem eventKey={i}>{name}</NavItem>
      </LinkContainer>
    )
  },

  getCustomFieldsLink(is_superuser) {
    return is_superuser ? (
      <LinkContainer to="/app/manage/custom-fields">
        <MenuItem eventKey={1.8}>Add/Remove Custom Fields</MenuItem>
      </LinkContainer>
    ) : null
  },

  getManagerLink(url, name) {
    var i = INDEX
    INDEX = INDEX + 1
    return (
      <NavDropdown eventKey={i} title={name} id="manage-nav-dropdown">
        <LinkContainer to="/app/manage/requests">
          <MenuItem eventKey={1.1}>Manage Requests</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/manage/loans">
          <MenuItem eventKey={1.2}>Manage Loans and Disbursements</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/manage/emails">
          <MenuItem eventKey={1.3}>Configure Email Settings</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/manage/tags">
          <MenuItem href="/app/manage/tags" eventKey={1.2}>Manage Tags</MenuItem>
        </LinkContainer>
        { this.getCustomFieldsLink(this.props.route.user.is_superuser) }
        <LinkContainer to="/app/manage/disburse">
          <MenuItem eventKey={1.4}>Create New Loan or Disbursement</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/manage/transactions">
          <MenuItem eventKey={1.5}>Aquisitions and Losses</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/manage/logs">
          <MenuItem eventKey={1.6}>View Logs</MenuItem>
        </LinkContainer>
      </NavDropdown>
    )

  },

  getCog(name) {
    return (
      <span>{name} <Glyphicon glyph="cog"/></span>
    )
  },

  getAdminLink(url, name) {
    var i = INDEX
    INDEX = INDEX + 1
    return (
      <NavDropdown eventKey={i} title={name} id="admin-nav-dropdown">
        <LinkContainer to="/app/admin/users/create/">
          <MenuItem eventKey={2.1}>Create Users</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/admin/users/manage/">
          <MenuItem eventKey={2.2}>Manage Users</MenuItem>
        </LinkContainer>
        <LinkContainer to="/app/admin/adminpanel/">
          <MenuItem eventKey={2.3}>Django Admin Panel</MenuItem>
        </LinkContainer>
      </NavDropdown>
    )
  },

  getUserLink(user) {
    var i = INDEX
    INDEX = INDEX + 1
    return (
      <NavDropdown eventKey={i} title={user.username} id="user-nav-dropdown">
        <LinkContainer to="/app/settings">
          <MenuItem eventKey={3.1}>Settings</MenuItem>
        </LinkContainer>
        <MenuItem eventKey={3.2} onClick={this.goToURL("/api/logout/")}>Logout</MenuItem>
      </NavDropdown>
    )
  },

  getAPIDropdown() {
    var i = INDEX
    INDEX = INDEX + 1
    return (
      <NavDropdown eventKey={i} title={API} id="api-nav-dropdown">
        <LinkContainer to="https://github.com/nbv3/kip_ventory/blob/ccbacb42f07b8eb28d471021c6d88ecbd8df5ff0/API.md">
          <MenuItem eventKey={4.1}>API Guide</MenuItem>
        </LinkContainer>
        <MenuItem eventKey={3.2} onClick={this.goToURL("/swagger/")}>API Tester</MenuItem>
      </NavDropdown>
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
              {this.getLink("/app/inventory/", "Inventory")}
              {this.getLink("/app/requests/", "My Requests")}
              {this.getLink("/app/loans/", "My Loans and Disbursements")}

              {(this.props.route.user.is_staff)     ? this.getManagerLink("/app/manage/", "Manage") : null}
              {(this.props.route.user.is_superuser) ? this.getAdminLink("/app/admin/",  "Admin") : null}
            </Nav>
            <Nav pullRight>
              {this.getLink("/app/cart/", <Glyphicon glyph="shopping-cart" />)}
              {this.getAPIDropdown()}
              {this.getUserLink(this.props.route.user)} 
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Grid fluid>
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
