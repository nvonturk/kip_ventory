import React from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel,
         Button, Checkbox, Table, Modal, Well, Alert, Glyphicon, Pagination } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

import CustomFieldInfoPanel from './CustomFieldInfoPanel'
import CustomFieldList from './CustomFieldList'


const CustomFieldContainer = React.createClass({

  getInitialState() {
    return {}
  },

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col sm={12}>
            <h3>Custom Fields</h3>
            <hr />
            <p>
              Custom fields are administrator-defined fields that will be tracked for all items.
            </p>
            <p>
              Fields marked private are hidden from non-managerial users, and are explicitly for administrative use.
            </p>
            <br />
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            <CustomFieldInfoPanel />
          </Col>

          <Col sm={6}>
            <CustomFieldList />
          </Col>
        </Row>

      </Grid>
    )
  }
})

export default CustomFieldContainer
