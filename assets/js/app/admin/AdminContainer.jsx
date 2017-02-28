import React, { Component } from 'react'
import { IndexLink } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { Grid, Row, Col, Nav, NavItem } from 'react-bootstrap'
import UserPrivilegesContainer from './users/UserPrivilegesContainer'

class AdminContainer extends Component {
  constructor(props) {
    super(props); 
    this.state = {
      activeKey: 0,
      headers: ['', 'Create Users', 'Manage Users'], //New User Requests
      currentHeader: ''
    };

    this.handleSelect = this.handleSelect.bind(this);
  }

  handleSelect(key) {
    var header = this.state.headers[key];
    this.setState({
      activeKey: key,
      currentHeader: header,
    })
  }

  render() {
    //<a href="/admin/">Admin Panel</a>
    return (
      <Grid>
        <Row>
          <Col md={2}>
            <IndexLink to="/app/admin/" onClick={() => this.handleSelect(0)}>
              <h4>Administration</h4>
            </IndexLink>
          </Col>
          <Col md={9} mdOffset={1}>
            <h4>{this.state.currentHeader}</h4>
          </Col>
        </Row>
        <Row>
          <Col md={2}>
            <Row>
              <Nav bsStyle="pills" stacked activeKey={this.state.activeKey} onSelect={this.handleSelect}>
                <LinkContainer to="/app/admin/users/create/">
                  <NavItem eventKey={1}>{this.state.headers[1]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/admin/users/manage/">
                  <NavItem eventKey={2}>{this.state.headers[2]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/admin/adminpanel/">
                  <NavItem eventKey={3}>Django Admin Panel</NavItem>
                </LinkContainer>
                
              </Nav>
            </Row>
          </Col>
          <Col md={9} mdOffset={1}>
            { this.props.children }
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default AdminContainer;
