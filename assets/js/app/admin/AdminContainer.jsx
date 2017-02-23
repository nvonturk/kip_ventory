import React from 'react'
import { IndexLink } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { Grid, Row, Col, Nav, NavItem } from 'react-bootstrap'
import UserPrivilegesContainer from './users/UserPrivilegesContainer'

function AdminContainer(props){
  return (
    <div>
      <a href="/admin/">Admin Panel</a>
      <UserPrivilegesContainer />
    </div>
  )
}
/*
const AdminContainer = React.createClass({
  getInitialState() {
    var greeting = "Welcome, " + this.props.route.admin.first_name
    return {
      activeKey: 0,
      headers: [greeting, 'Disbursement', 'Requests', 'Transactions', 'New User Requests'],
      currentHeader: greeting
    }
  },

  handleSelect(key) {
    var header = this.state.headers[key]
    this.setState({
      activeKey: key,
      currentHeader: header,
    })
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col md={2}>
            <IndexLink to="/app/admin" onClick={() => this.handleSelect(0)}>
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
                <LinkContainer to="/app/admin/disburse">
                  <NavItem eventKey={1}>{this.state.headers[1]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/admin/requests">
                  <NavItem eventKey={2}>{this.state.headers[2]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/admin/transactions">
                  <NavItem eventKey={3}>{this.state.headers[3]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/admin/newuserrequests">
                  <NavItem eventKey={4}>{this.state.headers[4]}</NavItem>
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
})
*/

export default AdminContainer;
