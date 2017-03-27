import React from 'react'
import { IndexLink } from 'react-router'
import { LinkContainer } from 'react-router-bootstrap'
import { Grid, Row, Col, Nav, NavItem } from 'react-bootstrap'


const ManagerContainer = React.createClass({
  getInitialState() {
    return {
      activeKey: 1,
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

          <Col sm={12} >
            { this.props.children }
          </Col>
        </Row>
      </Grid>
    )
  }
})

export default ManagerContainer;
