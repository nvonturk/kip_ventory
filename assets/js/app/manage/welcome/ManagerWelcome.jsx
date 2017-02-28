import React from 'react'
import {Grid, Row, Col} from 'react-bootstrap'

const ManagerWelcome = React.createClass({

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col sm={12}>
            <p>Use the links on the left to disburse items, respond to requests, and view transaction history.</p>
          </Col>
        </Row>
      </Grid>
    )
  }
})

export default ManagerWelcome;
