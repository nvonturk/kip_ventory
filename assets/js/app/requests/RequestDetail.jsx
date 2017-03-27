import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label, Form, Alert, Well, FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import ItemTableDetail from '../inventory/ItemTableDetail'

const RequestDetail = React.createClass({
  getInitialState() {
    return {
      request_id: "",
      requested_items: [],
      original_items: [],
      requester: "",
      date_open: "",
      open_comment: "",
      date_closed: "",
      closed_comment: "",
      administrator: "",
      status: "X",
      requestExists: true,
      forbidden: false,
    }
  },

  componentWillMount() {
    this.getRequest();
  },

  getRequest() {
    var url = "/api/requests/" + this.props.params.request_id + "/";
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "GET",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          request_id: response.request_id,
          requested_items: response.requested_items,
          original_items: JSON.parse(JSON.stringify(response.requested_items)),
          requester: response.requester,
          date_open: response.date_open,
          open_comment: response.open_comment,
          date_closed: response.date_closed,
          closed_comment: response.closed_comment,
          administrator: response.administrator,
          status: response.status,
          requestExists: true,
          forbidden: false
        })
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 404) {
          _this.setState({
            requestExists: false
          })
        } else if (xhr.status == 403) {
          _this.setState({
            forbidden: true
          })
        }
      }
    });
  },

  denyRequest(e) {
    e.preventDefault()
    var url = "/api/requests/" + this.state.request_id + "/"
    var _this = this
    var data = {
      closed_comment: this.state.closed_comment,
      status: "D"
    }
    ajax({
      url: url,
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          request_id: response.request_id,
          requested_items: response.requested_items,
          original_items: JSON.parse(JSON.stringify(response.requested_items)),
          requester: response.requester,
          date_open: response.date_open,
          open_comment: response.open_comment,
          date_closed: response.date_closed,
          closed_comment: response.closed_comment,
          administrator: response.administrator,
          status: response.status,
          requestExists: true
        })
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 404) {
          _this.setState({
            requestExists: false
          })
        }
      }
    });
  },

  approveRequest(e) {
    e.preventDefault()
    var url = "/api/requests/" + this.state.request_id + "/"
    var _this = this
    var data = {
      requested_items: this.state.requested_items,
      closed_comment: this.state.closed_comment,
      status: "A"
    }
    console.log(JSON.stringify(data))
    ajax({
      url: url,
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        console.log(response)
        _this.setState({
          request_id: response.request_id,
          requested_items: response.requested_items,
          original_items: JSON.parse(JSON.stringify(response.requested_items)),
          requester: response.requester,
          date_open: response.date_open,
          open_comment: response.open_comment,
          date_closed: response.date_closed,
          closed_comment: response.closed_comment,
          administrator: response.administrator,
          status: response.status,
          requestExists: true
        })
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 400) {
          console.log(xhr)
        } else if (xhr.status == 404) {
          _this.setState({
            requestExists: false
          })
        } else if (xhr.status == 403) {
          _this.setState({
            forbidden: true
          })
        }
      }
    });
  },

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  handleRequestItemTypeChange(i, e) {
    var requested_items = this.state.requested_items
    requested_items[i].request_type = e.target.value
    this.setState({
      requested_items: requested_items
    })
  },

  handleRequestItemQuantityChange(i, e) {
    var requested_items = this.state.requested_items
    requested_items[i].quantity = Number(e.target.value)
    this.setState({
      requested_items: requested_items
    })
  },

  getModifiableRequestedItems() {
    if (this.state.requested_items.length > 0) {
      return (
        <Table hover condensed>
          <thead>
            <tr>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} rowSpan={2} className="text-center">Item</th>
              <th style={{width:"40%", border: "1px solid #596a7b", verticalAlign:"middle"}} colSpan={2} className="text-center">Requested</th>
              <th style={{width:"40%", border: "1px solid #596a7b", verticalAlign:"middle"}} colSpan={2} className="text-center">Approved</th>
            </tr>
            <tr>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.requested_items.map( (ri, i) => {
              var ri_original = this.state.original_items[i]
              return (
                <tr key={ri.item}>
                  <td style={{verticalAlign:"middle"}} data-th="Item" className="text-center">
                    <h5 style={{color: "#df691a"}} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}}>{ri.item}</h5>
                  </td>
                  <td style={{verticalAlign:"middle"}} data-th="Requested Type" className="text-center">{ri_original.request_type}</td>
                  <td style={{verticalAlign:"middle"}} data-th="Requested Quantity" className="text-center">{ri_original.quantity}</td>
                  <td style={{verticalAlign:"middle"}} data-th="Approved Type" className="text-center">
                    <FormControl className="text-center"
                                 style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                                 componentClass="select"
                                 value={this.state.requested_items[i].request_type}
                                 onChange={this.handleRequestItemTypeChange.bind(this, i)}>
                      <option value="disbursement">Disbursement</option>
                      <option value="loan">Loan</option>
                    </FormControl>
                  </td>
                  <td style={{verticalAlign:"middle"}} data-th="Approved Quantity" className="text-center">
                    <FormControl type="number" min={1} className="text-center"
                                 style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                                 value={this.state.requested_items[i].quantity}
                                 onChange={this.handleRequestItemQuantityChange.bind(this, i)}>
                    </FormControl>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Well bsSize="small" className="text-center">There are no items in this request.</Well>
      )
    }
  },

  getApprovedRequestedItems() {
    if (this.state.requested_items.length > 0) {
      return (
        <Table hover condensed>
          <thead>
            <tr>
              <th style={{width:"30%", border: "1px solid #596a7b", verticalAlign:"middle"}} rowSpan={2} className="text-center">Item</th>
              <th style={{width:"70%", border: "1px solid #596a7b", verticalAlign:"middle"}} colSpan={2} className="text-center">
                Approved
              </th>
            </tr>
            <tr>
              <th style={{width:"35%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"35%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.requested_items.map( (ri, i) => {
              var label = (ri.request_type == "loan") ? (
                <Label bsStyle="primary">Loan</Label>
              ) : (
                <Label bsStyle="info">Disbursement</Label>
              )
              return (
                <tr key={ri.item}>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} data-th="Item" className="text-center">
                    <h5 style={{color: "#df691a"}} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}}>{ri.item}</h5>
                  </td>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">{label}</td>
                  <td style={{verticalAlign:"middle", borderRight: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">{ri.quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Well bsSize="small" className="text-center">There are no items in this request.</Well>
      )
    }
  },

  getDeniedRequestedItems() {
    if (this.state.requested_items.length > 0) {
      return (
        <Table hover condensed>
          <thead>
            <tr>
              <th style={{width:"30%", border: "1px solid #596a7b", verticalAlign:"middle"}} rowSpan={2} className="text-center">Item</th>
              <th style={{width:"70%", border: "1px solid #596a7b", verticalAlign:"middle"}} colSpan={2} className="text-center">
                Requested
              </th>
            </tr>
            <tr>
              <th style={{width:"35%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"35%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.requested_items.map( (ri, i) => {
              var label = (ri.request_type == "loan") ? (
                <Label bsStyle="primary">Loan</Label>
              ) : (
                <Label bsStyle="info">Disbursement</Label>
              )
              return (
                <tr key={ri.item}>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} data-th="Item" className="text-center">
                    <h5 style={{color: "#df691a"}} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}}>{ri.item}</h5>
                  </td>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">
                    { label }
                  </td>
                  <td style={{verticalAlign:"middle", borderRight: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">{ri.quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Well bsSize="small" className="text-center">There are no items in this request.</Well>
      )
    }
  },

  getReadOnlyRequestedItems() {
    if (this.state.requested_items.length > 0) {
      return (
        <Table hover condensed>
          <thead>
            <tr>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} rowSpan={2} className="text-center">Item</th>
              <th style={{width:"40%", border: "1px solid #596a7b", verticalAlign:"middle"}} colSpan={2} className="text-center">
                Requested
              </th>
              <th style={{width:"40%", border: "1px solid #596a7b", verticalAlign:"middle"}} colSpan={2} className="text-center">
                Approved
              </th>
            </tr>
            <tr>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"20%", border: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.requested_items.map( (ri, i) => {
              var ri_original = this.state.original_items[i]
              var approved_type = (this.state.status == 'A') ? ri.request_type : "N/A"
              var approved_quantity = (this.state.status == 'A') ? ri.quantity: "N/A"
              return (
                <tr key={ri.item}>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} data-th="Item" className="text-center">
                    <h5 style={{color: "#df691a"}} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}}>{ri.item}</h5>
                  </td>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">{ri_original.request_type}</td>
                  <td style={{verticalAlign:"middle", borderBottom: "1px solid #596a7b"}} className="text-center">{ri_original.quantity}</td>
                  <td style={{verticalAlign:"middle", borderLeft: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">{approved_type}</td>
                  <td style={{verticalAlign:"middle", borderRight: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}} className="text-center">{approved_quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Well bsSize="small" className="text-center">There are no items in this request.</Well>
      )
    }
  },

  getRequestedItemsPanel() {
    if ((this.props.route.user.is_staff || this.props.route.user.is_superuser) && (this.state.status == 'O')) {
      return (
        <Panel header={"Requested Items"}>
          { this.getModifiableRequestedItems() }
        </Panel>
      )
    } else {
      if (this.state.status == 'A') {
        return (
          <Panel header={"Requested Items"}>
            { this.getApprovedRequestedItems() }
          </Panel>
        )
      } else if (this.state.status == 'D') {
        return (
          <Panel header={"Requested Items"}>
            { this.getDeniedRequestedItems() }
          </Panel>
        )
      } else if (this.state.status == 'O') {
        return (
          <Panel header={"Requested Items"}>
            { this.getReadOnlyRequestedItems() }
          </Panel>
        )
      }
    }
  },

  getRequestInfoPanel() {
    var administrator = null
    var date_closed = null
    var closed_comment = null
    var hr = null
    var approvalForm = null
    if (this.state.status == 'A' || this.state.status == 'D') {
      administrator = (
        <tr>
          <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Administrator</th>
          <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.administrator}</td>
        </tr>
      )
      date_closed = (
        <tr>
          <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Date Closed</th>
          <td style={{width: "60%", border: "1px solid #596a7b"}}>{new Date(this.state.date_closed).toLocaleString()}</td>
        </tr>
      )
      closed_comment = (
        <tr>
          <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Administrator Comment</th>
          <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.closed_comment}</td>
        </tr>
      )
      hr = (
        <tr>
          <td colSpan={2}>
            <br />
          </td>
        </tr>
      )
    } else if (this.state.status == 'O' && (this.props.route.user.is_staff || this.props.route.user.is_superuser)){
      approvalForm = (
        <Form horizontal>
          <br />
          <FormGroup bsSize="small">
            <Col xs={10} xsOffset={1}>
              <FormControl
                type="text"
                style={{resize: "vertical", height:"100px"}}
                componentClass={"textarea"}
                name="closed_comment"
                value={this.state.closed_comment}
                onChange={this.handleChange}
              />
              <HelpBlock>Provide feedback as to why you are approving or denying this request.</HelpBlock>
            </Col>
          </FormGroup>
          <FormGroup bsSize="small">
            <Col xs={2} xsOffset={4} style={{textAlign: "center"}}>
              <Button bsStyle="info" bsSize="small" onClick={this.approveRequest}>Approve</Button>
            </Col>
            <Col xs={2} style={{textAlign: "center"}}>
              <Button bsStyle="danger" bsSize="small" onClick={this.denyRequest}>Deny</Button>
            </Col>
          </FormGroup>
        </Form>
      )
    } else if (this.state.status == 'O' && !(this.props.route.user.is_staff || this.props.route.user.is_superuser)){
      approvalForm = null
    }


    return (
      <Panel header={"Request Details"}>
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>
            <tr>
              <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Requester</th>
              <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.requester}</td>
            </tr>

            <tr>
              <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Date Requested</th>
              <td style={{width: "60%", border: "1px solid #596a7b"}}>{new Date(this.state.date_open).toLocaleString()}</td>
            </tr>

            <tr>
              <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Justification</th>
              <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.open_comment}</td>
            </tr>

            {  hr  }

            { administrator }
            { date_closed }
            { closed_comment }

          </tbody>
        </Table>
        { approvalForm }
      </Panel>
    )
  },

  render() {
    if (this.state.forbidden) {
      return (
        <Grid>
          <Row>
            <Col sm={12}>
              <h3>403 - You do not have permission to view this request.</h3>
              <hr />
            </Col>
          </Row>
        </Grid>
      )
    }
    if (this.state.requestExists) {
      var statusIndicator = null;
      if (this.state.status == "A") {
        statusIndicator = (
          <Row>
            <Col sm={12}>
              <Alert className="text-center" bsStyle="success">This request has been approved.</Alert>
            </Col>
          </Row>
        )
      } else if (this.state.status == "D") {
        statusIndicator = (
          <Row>
            <Col sm={12}>
              <Alert className="text-center" bsStyle="danger">This request has been denied.</Alert>
            </Col>
          </Row>
        )
      } else if (this.state.status == 'O') {
        statusIndicator = (
          <Row>
            <Col sm={12}>
              <Alert className="text-center" bsStyle="warning">This request is awaiting approval from an administrator.</Alert>
            </Col>
          </Row>
        )
      }
      return (
        <Grid>
          <Row>
            <Col sm={12}>
              <h3>View Request <span style={{fontSize:"14px"}}>ID # {this.state.request_id}</span></h3>
              <hr />
            </Col>
          </Row>

          { statusIndicator }

          <Row>
            <Col sm={6}>
              { this.getRequestedItemsPanel() }
            </Col>
            <Col sm={6}>
              { this.getRequestInfoPanel() }
            </Col>
          </Row>



        </Grid>
      )
    } else {
      return (
        <Grid>
          <Row>
            <Col sm={12}>
              <h3>404 - Request with ID {this.props.params.request_id} not found.</h3>
              <hr />
            </Col>
          </Row>
        </Grid>
      )
    }
  }
})

export default RequestDetail
