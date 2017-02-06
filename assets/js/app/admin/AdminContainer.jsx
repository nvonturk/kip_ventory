import React from 'react'
import {Grid, Row, Col} from 'react-bootstrap'
import AdminRequestsContainer from "./AdminRequestsContainer"
import DisbursementContainer from "./DisbursementContainer"
import TransactionsContainer from '../TransactionsContainer'

const AdminContainer = React.createClass({
  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <DisbursementContainer admin={this.props.route.admin}/>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <AdminRequestsContainer admin={this.props.route.admin}/>
          </Col>
        </Row>
        <Row>
          <Col xs={12}>
            <TransactionsContainer admin={this.props.route.admin}/>
          </Col>
        </Row>
      </Grid>
    )
  }
})

export default AdminContainer;
