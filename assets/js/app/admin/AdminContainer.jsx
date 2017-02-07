import React from 'react'
import {Link} from 'react-router'
import {LinkContainer} from 'react-router-bootstrap'
import {Navbar, Grid, Row, Col, Panel, Nav, NavItem} from 'react-bootstrap'
import AdminRequestsContainer from "./requests/AdminRequestsContainer"
import DisbursementContainer from "./disbursement/DisbursementContainer"
import TransactionsContainer from './transactions/TransactionsContainer'

const AdminContainer = React.createClass({
  getInitialState() {
    var greeting = "Welcome, " + this.props.route.admin.first_name
    return {
      activeKey: 0,
      headers: [greeting, 'Disbursement', 'Requests', 'Transactions'],
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

  getAdminWelcomeMessage() {
    return (
      <Grid fluid>
        <Row>
          <p>Use the links on the left to disburse items, respond to requests, and view transaction history.</p>
        </Row>
      </Grid>
    )
  },

  getAdminPanelContent() {
    return this.props.children ? this.props.children : this.getAdminWelcomeMessage()
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col md={2}>
            <Link to="/app/admin" onClick={() => this.handleSelect(0)}>
              <h4>Administration</h4>
            </Link>
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
              </Nav>
            </Row>
          </Col>
          <Col md={9} mdOffset={1}>
            {this.getAdminPanelContent()}
          </Col>
        </Row>
      </Grid>
    )
  }
})

export default AdminContainer;
