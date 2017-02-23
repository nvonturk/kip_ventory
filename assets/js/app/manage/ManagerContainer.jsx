import React from 'react'
import { IndexLink } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { Grid, Row, Col, Nav, NavItem } from 'react-bootstrap'


const ManagerContainer = React.createClass({
  getInitialState() {
    var greeting = "Welcome, " + this.props.route.admin.first_name
    return {
      activeKey: 0,
      headers: [greeting, 'Disbursement', 'Requests', 'Transactions', 'New User Requests', 'Logs'],
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
            <IndexLink to="/app/manage" onClick={() => this.handleSelect(0)}>
              <h4>Management</h4>
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
                <LinkContainer to="/app/manage/disburse">
                  <NavItem eventKey={1}>{this.state.headers[1]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/requests">
                  <NavItem eventKey={2}>{this.state.headers[2]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/transactions">
                  <NavItem eventKey={3}>{this.state.headers[3]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/newuserrequests">
                  <NavItem eventKey={4}>{this.state.headers[4]}</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/logs">
                  <NavItem eventKey={5}>{this.state.headers[5]}</NavItem>
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

export default ManagerContainer;
