import React from 'react'
import AdminRequestContainer from "./adminrequestscontainer"
import DisbursementContainer from "./disbursementcontainer"

const AdminContainer = React.createClass({
  render() {
    return (
      <div>
        <DisbursementContainer/>
        <AdminRequestContainer/>
      </div>
    )
  }
})

export default AdminContainer;
