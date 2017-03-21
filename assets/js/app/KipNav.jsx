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
              {this.getLink("/app/requests/", "Your Requests")}
              {(this.props.route.user.is_staff)     ? this.getLink("/app/manage/", "Manage") : null}
              {(this.props.route.user.is_superuser) ? this.getLink("/app/admin/",  "Admin") : null}
            </Nav>
            <Nav pullRight>
              {this.getLink("/app/cart/", "Cart")}
              {this.getLink("/app/profile/", "Profile")}
              {this.getLink("/swagger/", "API")}
              <NavItem eventKey={INDEX} onClick={this.goToURL("/api/logout/")}>Logout</NavItem>
              <NavItem eventKey={INDEX+1}><Glyphicon glyph="cog" /></NavItem>
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
