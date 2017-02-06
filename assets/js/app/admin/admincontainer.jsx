import React from 'react'
import AdminRequestContainer from "./adminrequestscontainer"
import DisbursementContainer from "./disbursementcontainer"
import TransactionsContainer from '../transactionsContainer'

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
