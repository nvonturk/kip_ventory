import React from 'react'
import {Grid, Row} from 'react-bootstrap'

const AdminWelcome = React.createClass({

  render() {
    return (
      <Grid fluid>
        <Row>
          <p>Use the links on the left to create and manage users.</p>
        </Row>
      </Grid>
    )
  }
})

export default AdminWelcome;
