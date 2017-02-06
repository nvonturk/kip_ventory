import React from 'react'
import AdminRequestContainer from "./AdminRequestsContainer"
import DisbursementContainer from "./DisbursementContainer"
import TransactionsContainer from '../TransactionsContainer'

const AdminContainer = React.createClass({
  render() {
    return (
      <div>
        <DisbursementContainer/>
        <AdminRequestContainer/>
        <TransactionsContainer/>
      </div>
    )
  }
})

export default AdminContainer;
