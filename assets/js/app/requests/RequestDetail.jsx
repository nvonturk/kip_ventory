import React, { Component } from 'react'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label, Form, FormControl, FormGroup, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

const STATUS = {
  O: <Label bsStyle="warning">Outstanding</Label>,
  A: <Label bsStyle="success">Approved</Label>,
  D: <Label bsStyle="danger">Denied</Label>
}

const RequestDetail = React.createClass({
  getInitialState() {
    return {
      request_id: "",
      requested_items: [],
      requester: "",
      date_open: "",
      open_comment: "",
      date_closed: "",
      closed_comment: "",
      administrator: "",
      status: "",
    }
  },

  componentWillMount() {
    this.getRequest();
  },

  getRequest() {
    var url = "/api/requests/" + this.props.params.request_id;
    var _this = this
    getJSON(url, function(data) {
      _this.setState(data)
    })
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col sm={12}>
            <h3>View Request <span style={{fontSize:"14px"}}>ID # {this.state.request_id}</span></h3>
            <hr />
          </Col>
        </Row>

        <Row>
          
        </Row>
      </Grid>
    )
  }
})

export default RequestDetail
