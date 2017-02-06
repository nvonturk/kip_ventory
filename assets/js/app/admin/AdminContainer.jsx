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
          <div className="page-header" style={{margin:'25px 0px 25px'}}>
            <h3>Disburse items</h3>
          </div>
          <Col xs={12}>
            <DisbursementContainer admin={this.props.route.admin}/>
          </Col>
        </Row>
        <Row>
          <div className="page-header" style={{margin:'25px 0px 25px'}}>
            <h3>Respond to requests</h3>
          </div>
          <Col xs={12}>
            <AdminRequestsContainer admin={this.props.route.admin}/>
          </Col>
        </Row>
        <Row>
          <div className="page-header" style={{margin:'25px 0px 25px'}}>
            <h3>View transaction history</h3>
          </div>
          <Col xs={12}>
            <TransactionsContainer admin={this.props.route.admin}/>
          </Col>
        </Row>
      </Grid>
    )
  }
})

export default AdminContainer;
