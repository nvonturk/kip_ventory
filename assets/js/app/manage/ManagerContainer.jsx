import React from 'react'
import { IndexLink } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { Grid, Row, Col, Nav, NavItem } from 'react-bootstrap'


const ManagerContainer = React.createClass({
  getInitialState() {
    return {
      activeKey: 0,
    }
  },

  handleSelect(key) {
    this.setState({
      activeKey: key,
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
        </Row>
        <Row>
          <Col md={2}>
            <Row>
              <Nav bsStyle="pills" stacked activeKey={this.state.activeKey} onSelect={this.handleSelect}>
                <LinkContainer to="/app/manage/create-item">
                  <NavItem eventKey={1}>Create Items</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/disburse">
                  <NavItem eventKey={2}>Disbursement</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/requests">
                  <NavItem eventKey={3}>Requests</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/transactions">
                  <NavItem eventKey={4}>Transactions</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/logs">
                  <NavItem eventKey={5}>Logs</NavItem>
                </LinkContainer>
              </Nav>
            </Row>
          </Col>
          <Col md={10}>
            { this.props.children }
          </Col>
        </Row>
      </Grid>
    )
  }
})

export default ManagerContainer;
