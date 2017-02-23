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

  getCustomFieldsLink(is_superuser) {
    return is_superuser ? (
      <LinkContainer to="/app/manage/custom-fields">
        <NavItem eventKey={2}>Custom Fields</NavItem>
      </LinkContainer>
    ) : null
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col md={2}>
            <br />
          </Col>
        </Row>
        <Row>
          <Col md={2}>
            <Row>
              <Nav bsStyle="pills" stacked activeKey={this.state.activeKey} onSelect={this.handleSelect}>
                <LinkContainer to="/app/manage/create-item">
                  <NavItem eventKey={1}>Create Items</NavItem>
                </LinkContainer>

                { this.getCustomFieldsLink(this.props.route.admin.is_superuser) }

                <LinkContainer to="/app/manage/disburse">
                  <NavItem eventKey={3}>Disbursement</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/requests">
                  <NavItem eventKey={4}>Requests</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/transactions">
                  <NavItem eventKey={5}>Transactions</NavItem>
                </LinkContainer>
                <LinkContainer to="/app/manage/logs">
                  <NavItem eventKey={6}>Logs</NavItem>
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
