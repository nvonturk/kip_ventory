import React from 'react'
import {Grid, Row} from 'react-bootstrap'

const AdminWelcome = React.createClass({

  render() {
    return (
      <Grid fluid>
        <Row>
          <p>Use the links on the left to disburse items, respond to requests, and view transaction history.</p>
        </Row>
      </Grid>
    )
  }
})

export default AdminWelcome;
