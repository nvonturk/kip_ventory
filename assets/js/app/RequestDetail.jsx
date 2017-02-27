import React, { Component } from 'react'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label, Form, FormControl, FormGroup, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../csrf/DjangoCSRFToken'

const STATUS = {
  O: <Label bsStyle="warning">Outstanding</Label>,
  A: <Label bsStyle="success">Approved</Label>,
  D: <Label bsStyle="danger">Denied</Label>
}

const RequestDetail = React.createClass({
  getInitialState() {
    return {
      request_id: "",
      request_items: [],
      requester: "",
      date_open: "",
      open_comment: "",
      date_closed: "",
      closed_comment: "",
      administrator: "",
      status: "",
      form_comment: "",
      form_status: "A"
    }
  },

  getRequest() {
    var url = "/api/requests/" + this.props.params.request_id;
    var _this = this
    getJSON(url, function(data) {
      _this.setState(data)
    })
  },

  componentWillMount() {
    this.getRequest();
  },

  getRequestItemEntry(request_item) {
    var url = "/app/items/" + request_item.item
    return (
      <Row key={request_item.item}>
        <Col sm={6} className="text-left">
          <a href={url}>{request_item.item}</a>
        </Col>
        <Col sm={6} className="text-center">
          <p>{request_item.quantity}</p>
        </Col>
      </Row>
    )
  },

  onChange(e) {
    e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  getDateString(str) {
    if (str == "" || str == null) {
      return ""
    }
    var d = new Date(str)
    return d.toLocaleString()
  },

  handleSubmit(e) {
    e.preventDefault()
    var _this = this;
    ajax({
      url:"/api/requests/" + this.state.request_id + "/",
      type: "PUT",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        closed_comment: this.state.form_comment,
        status: this.state.form_status
      },
      success:  function(response){
        console.log(response)
        _this.setState({
          status: response.status,
          closed_comment: response.closed_comment,
          date_closed: response.date_closed,
          administrator: response.administrator
        })
      },
      complete: function(){},
      error:    function (xhr, textStatus, thrownError){
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
        alert("error doing something");
      }
    });
  },

  getOutstandingRequestPanel() {
    return (
      <Col sm={8} smOffset={2}>
        <Row>
          <Col sm={12}>
            <Panel>
              <h4>Modify Request</h4>
              <hr />

              <Form horizontal>
                <FormGroup bsSize="small">
                  <Col componentClass={ControlLabel} sm={2}>
                    Status
                  </Col>
                  <Col sm={9} >
                    <FormControl componentClass="select" name="form_status" value={this.state.form_status} onChange={this.onChange}>
                      <option value="A">Approved</option>
                      <option value="D">Denied</option>
                    </FormControl>
                  </Col>
                </FormGroup>

                  <FormGroup bsSize="small">
                    <Col componentClass={ControlLabel} sm={2}>
                      Comment
                    </Col>
                    <Col sm={9}>
                      <FormControl type="text" componentClass="textarea" style={{resize: "vertical", height:"100px"}} placeholder="Comment" value={this.state.form_comment} name="form_comment" onChange={this.onChange} />
                    </Col>
                  </FormGroup>

                  <FormGroup>
                    <Col smOffset={4} sm={2}>
                      <Button bsSize="small" bsStyle="info" onClick={this.handleSubmit}>Submit</Button>
                    </Col>
                    <Col sm={2}>
                      <Button bsSize="small" bsStyle="danger" onClick={this.handleCancel}>Cancel Request</Button>
                    </Col>
                  </FormGroup>
                </Form>

            </Panel>
          </Col>
        </Row>
      </Col>
    )
  },

  getRequestModifyPanel() {
    if (this.state.status == "O") {
      return this.getOutstandingRequestPanel()
    } else {
      return null
    }
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col sm={8} smOffset={2}>
            <h3>Request Details</h3>
            <hr />
          </Col>
        </Row>


        <Row>

          { this.getRequestModifyPanel() }

          <Col sm={8} smOffset={2}>
            <Panel>
              <h4>Request Information</h4>
              <hr />

              <Row>

                <Col sm={12}>

                  <Row>
                    <Col sm={6}>
                      <p>Status :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{STATUS[this.state.status]}</p>
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={6}>
                      <p>Requester :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{this.state.requester}</p>
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={6}>
                      <p>Date Opened :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{this.getDateString(this.state.date_open)}</p>
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={6}>
                      <p>Reason for Request :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{this.state.open_comment}</p>
                    </Col>
                  </Row>

                  <hr />

                  <Row>
                    <Col sm={6}>
                      <p>Date Closed :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{this.getDateString(this.state.date_closed)}</p>
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={6}>
                      <p>Administrator :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{this.state.administrator}</p>
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={6}>
                      <p>Administrator Comment :</p>
                    </Col>
                    <Col sm={6}>
                      <p>{this.state.closed_comment}</p>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Panel>

          </Col>

          <Col sm={8} smOffset={2}>
            <Panel>
              <h4>Request Items</h4>
              <hr />
              <Row>
                <Col sm={12}>
                  <Row>
                    <Col sm={6}>
                      Item Name
                    </Col>
                    <Col sm={6} className="text-center">
                      Quantity Requested
                    </Col>
                  </Row>
                  <br />
                </Col>
              </Row>
              { this.state.request_items.map( (ri, i) => {
                return this.getRequestItemEntry(ri)
              })}
            </Panel>
          </Col>
        </Row>

      </Grid>
    )
  }
})

export default RequestDetail
