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
          <DisbursementContainer admin={this.props.admin}/>
        </Row>
        <Row>
          <AdminRequestsContainer admin={this.props.admin}/>
        </Row>
        <Row>
          <TransactionsContainer admin={this.props.admin}/>
        </Row>
      </Grid>
    )
  }
})

export default AdminContainer;
