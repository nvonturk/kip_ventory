import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label, Form, Glyphicon, Alert, Well, FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

import LoanModal from '../../loans/LoanModal'

const ManagerRequestsDetail = React.createClass({
  getInitialState() {
    return {
      request: {
        request_id: this.props.params.request_id,
        requester: "",
        open_comment: "",
        date_open: "",
        closed_comment: "",
        administrator: "",
        date_closed: "",
        status: "",
        requested_items: [],
        approved_items: [],
        loans: [],
        disbursements: []
      },

      itemQuantities: {},

      requestExists: true,
      forbidden: false,

      showModal: false,
      loanToModify: null,
      returnQuantity: 0,
      disburseQuantity: 0,

      errorNodes: {}
    }
  },

  componentWillMount() {
    this.getRequest()
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
        if (response.status == "O") {
          var ris = JSON.parse(JSON.stringify(response.requested_items))
          response.approved_items = ris
        }
        _this.setState({
          request: response
        })
        for (var i=0; i<response.requested_items.length; i++) {
          var item = response.requested_items[i].item
          var url = "/api/items/" + item + "/"
          getJSON(url, function(data) {
            var itemQuantities = JSON.parse(JSON.stringify(_this.state.itemQuantities))
            itemQuantities[data.name] = Number(data.quantity)
            _this.setState({itemQuantities: itemQuantities})
          })
        }
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
    var url = "/api/requests/" + this.state.request.request_id + "/"
    var _this = this
    var data = {
      closed_comment: this.state.request.closed_comment,
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
        _this.getRequest()
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
    var url = "/api/requests/" + this.state.request.request_id + "/"
    var _this = this
    var data = {
      approved_items: this.state.request.approved_items,
      closed_comment: this.state.request.closed_comment,
      status: "A"
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
        _this.getRequest()
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 400) {
          var response = xhr.responseJSON
          var errNodes = {}
          for (var key in response) {
            if (response.hasOwnProperty(key)) {
              var messages = response[key]
              console.log(key, messages)
              var node = <span key={key} className="help-block">{messages[0]}</span>
              errNodes[key] = node
            }
          }
          _this.setState({
            errorNodes: errNodes
          })
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

  handleRequestItemTypeChange(i, e) {
    var request = JSON.parse(JSON.stringify(this.state.request))
    request.approved_items[i].request_type = e.target.value
    this.setState({
      request: request
    })
  },

  handleRequestItemQuantityChange(i, e) {
    var q = Number(e.target.value)
    var request = JSON.parse(JSON.stringify(this.state.request))
    var item_name = request.approved_items[i].item
    if (q <= this.state.itemQuantities[item_name]) {
      request.approved_items[i].quantity = Number(e.target.value)
      this.setState({
        request: request
      })
    }
  },

  handleClosedCommentChange(e) {
    var request = JSON.parse(JSON.stringify(this.state.request))
    request.closed_comment = e.target.value
    this.setState({
      request: request
    })
  },

  getStatusLabel() {
    if (this.state.request.status == "A") {
      return (<Label bsStyle="success" bsSize="large">Approved</Label>)
    } else if (this.state.request.status == "D") {
      return (<Label bsStyle="danger" bsSize="large">Denied</Label>)
    } else if (this.state.request.status == "O") {
      return (<Label bsStyle="warning" bsSize="large">Outstanding</Label>)
    } else {
      return null
    }
  },

  showModal(loan) {
    this.setState({
      showModal: true,
      loanToModify: loan,
      returnQuantity: 0,
      disburseQuantity: 0
    })
  },

  hideModal(e) {
    this.setState({
      showModal: false,
      loanToModify: null,
      returnQuantity: 0,
      disburseQuantity: 0
    })
  },

  getLegendPanel() {
    if (this.state.request.status == "A") {
      return (
        <div className="panel panel-default">

          <div className="panel-heading">
            <span style={{fontSize:"15px"}}>Legend</span>
          </div>

          <div className="panel-body">
            <Row style={{display: "flex"}}>
              <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
                <Glyphicon style={{color: "#5cb85c", fontSize:"18px"}} glyph="ok-circle" />
              </Col>
              <Col md={9}>
                <p style={{marginBottom:"0px", fontSize: "12px"}}>This item has been returned from loan.</p>
              </Col>
            </Row>
            <hr />
            <Row style={{display: "flex"}}>
              <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
                <Glyphicon style={{color: "#d9534f", fontSize:"18px"}} glyph="remove-circle" />
              </Col>
              <Col md={9}>
                <p style={{marginBottom: "0px", fontSize: "12px"}}>This item is still on loan.</p>
              </Col>
            </Row>
            <hr />
            <Row style={{display: "flex"}}>
              <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
                <Glyphicon style={{color: "#f0ad4e", fontSize:"18px"}} glyph="log-out" />
              </Col>
              <Col md={9}>
                <p style={{marginBottom: "0px", fontSize: "12px"}}>This item has been disbursed.</p>
              </Col>
            </Row>

          </div>

        </div>
      )
    } else {
      return null
    }
  },

  getValidationState(key) {
    return (this.state.errorNodes[key] == null) ? null : "error"
  },

  getRequestInfoPanel() {
    var administrator = null
    var date_closed = null
    var closed_comment = null
    var hr = null
    var approvalForm = null
    if (this.state.request.status == 'A' || this.state.request.status == 'D') {
      administrator = (
        <tr>
          <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Administrator</th>
          <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.request.administrator}</td>
        </tr>
      )
      date_closed = (
        <tr>
          <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Date Closed</th>
          <td style={{width: "60%", border: "1px solid #596a7b"}}>{new Date(this.state.request.date_closed).toLocaleString()}</td>
        </tr>
      )
      closed_comment = (
        <tr>
          <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Administrator Comment</th>
          <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.request.closed_comment}</td>
        </tr>
      )
      hr = (
        <tr>
          <td colSpan={2}>
            <br />
          </td>
        </tr>
      )
    } else if (this.state.request.status == 'O' && (this.props.route.user.is_staff || this.props.route.user.is_superuser)){
      approvalForm = (
        <Form horizontal onSubmit={e => {e.stopPropagation(); e.preventDefault();}}>
          <hr />
          <FormGroup bsSize="small" validationState={this.getValidationState('closed_comment')}>
            <Col xs={12} xsOffset={0}>
              <HelpBlock>Provide feedback as to why you are approving or denying this request.</HelpBlock>
              <hr />
              <FormControl
                type="text"
                style={{resize: "vertical", height:"100px"}}
                componentClass={"textarea"}
                name="closed_comment"
                value={this.state.request.closed_comment}
                onChange={this.handleClosedCommentChange}
              />
              { this.state.errorNodes['closed_comment']}
            </Col>
          </FormGroup>
          <FormGroup bsSize="small">
            <Col xs={4} xsOffset={4} style={{textAlign: "center"}}>
              <Button block bsStyle="info" bsSize="small" onClick={this.approveRequest}>Approve</Button>
              <Button block bsStyle="danger" bsSize="small" onClick={this.denyRequest}>Deny</Button>
            </Col>
          </FormGroup>
        </Form>
      )
    } else if (this.state.request.status == 'O' && !(this.props.route.user.is_staff || this.props.route.user.is_superuser)){
      approvalForm = null
    }


    return (
      <Panel header={"Request Details"}>
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>
            <tr>
              <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Requester</th>
              <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.request.requester}</td>
            </tr>

            <tr>
              <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Date Requested</th>
              <td style={{width: "60%", border: "1px solid #596a7b"}}>{new Date(this.state.request.date_open).toLocaleString()}</td>
            </tr>

            <tr>
              <th style={{width: "40%", paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Justification</th>
              <td style={{width: "60%", border: "1px solid #596a7b"}}>{this.state.request.open_comment}</td>
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

  getModifiableRequestedItems() {
    if (this.state.request.requested_items.length > 0) {
      return (
        <div>
        <Table hover style={{marginBottom: "0px"}}>
          <thead>
            <tr>
              <th style={{width:"30%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-left">Item</th>
              <th style={{width:" 5%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Stock:</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Requested For:</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Requested Quantity:</th>
              <th style={{width:" 5%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="spacer" />
              <th style={{width:"15%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Approved For:</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Approved Quantity:</th>
            </tr>
          </thead>
          <tbody>
            { this.state.request.requested_items.map( (ri, i) => {
              return (
                <tr key={ri.item} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}}>
                  <td style={{verticalAlign:"middle"}} data-th="Item" className="text-left">
                    <span style={{fontSize:"12px", color: "#df691a"}}>{ri.item}</span>
                  </td>
                  <td style={{verticalAlign:"middle"}} data-th="Stock:" className="text-center">{this.state.itemQuantities[ri.item]}</td>
                  <td style={{verticalAlign:"middle"}} data-th="Requested For:" className="text-center">{ri.request_type}</td>
                  <td style={{verticalAlign:"middle"}} data-th="Requested Quantity:" className="text-center">{ri.quantity}</td>
                  <td style={{verticalAlign:"middle"}} data-th="" className="spacer" />
                  <td style={{verticalAlign:"middle", zIndex:9999}} onClick={e => {e.stopPropagation()}} data-th="Approved For:" className="text-center">
                    <FormGroup style={{marginBottom: "0px"}}>
                      <FormControl className="text-center"
                                   style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                                   componentClass="select"
                                   value={this.state.request.approved_items[i].request_type}
                                   onChange={this.handleRequestItemTypeChange.bind(this, i)}>
                        <option value="disbursement">Disbursement</option>
                        <option value="loan">Loan</option>
                      </FormControl>
                    </FormGroup>
                  </td>
                  <td style={{verticalAlign:"middle", zIndex:9999}} onClick={e => {e.stopPropagation()}} data-th="Approved Quantity:" className="text-center">
                    <FormGroup bsSize="small" style={{marginBottom: "0px"}} validationState={this.getValidationState(ri.item)}>
                      <FormControl type="number" min={0} className="text-center"
                                   style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                                   value={this.state.request.approved_items[i].quantity}
                                   onChange={this.handleRequestItemQuantityChange.bind(this, i)}>
                      </FormControl>
                    </FormGroup>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
        </div>
      )
    } else {
      return (
        <Well style={{fontSize:"12px"}} bsSize="small" className="text-center">No items have been requested.</Well>
      )
    }
  },

  getReadOnlyRequestedItems() {
    if (this.state.request.requested_items.length > 0) {
      return (
        <Table hover style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width:"20%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-left">Item</th>
              <th style={{width:"20%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
              <th style={{width:"20%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.request.requested_items.map( (ri, i) => {
              return (
                <tr key={ri.item} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}}>
                  <td style={{verticalAlign:"middle"}} data-th="Item" className="text-left">
                    <span style={{color: "#df691a", fontSize:"12px"}}>{ri.item}</span>
                  </td>
                  <td style={{verticalAlign:"middle"}} className="text-center">{ri.request_type}</td>
                  <td style={{verticalAlign:"middle"}} className="text-center">{ri.quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      return (
        <Well style={{fontSize:"12px"}} bsSize="small" className="text-center">No items have been requested.</Well>
      )
    }
  },

  getRequestedItemsPanel() {
    if (this.state.request.status == "O") {
      return (
        <Panel header={"Requested Items"}>
          { this.getModifiableRequestedItems() }
        </Panel>
      )
    } else if (this.state.request.status == "A" || this.state.request.status == "D") {
      return (
        <Panel header={"Requested Items"}>
          { this.getReadOnlyRequestedItems() }
        </Panel>
      )
    } else {
      return null
    }
  },

  getApprovedItemsPanel() {
    if (this.state.request.approved_items.length > 0) {
      return (
        <Panel header={"Approved Items"}>
          <Table hover style={{marginBottom:"0px"}}>
            <thead>
              <tr>
                <th style={{width:"20%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-left">Item</th>
                <th style={{width:"20%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Type</th>
                <th style={{width:"20%", borderBottom: "1px solid #596a7b", verticalAlign:"middle"}} className="text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              { this.state.request.approved_items.map( (ai, i) => {
                return (
                  <tr key={ai.item} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ai.item + "/")}}>
                    <td style={{verticalAlign:"middle"}} data-th="Item" className="text-left">
                      <span style={{color: "#df691a", fontSize:"12px"}}>{ai.item}</span>
                    </td>
                    <td style={{verticalAlign:"middle"}} className="text-center">{ai.request_type}</td>
                    <td style={{verticalAlign:"middle"}} className="text-center">{ai.quantity}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Panel>
      )
    } else {
      return (
        <Panel header={"Approved Items"}>
          <Well bsSize="small" className="text-center">There are no approved items in this request.</Well>
        </Panel>
      )
    }
  },

  getLoanStatusSymbol(loan, fs) {
    if (loan.is_disbursement) {
      return (<Glyphicon style={{color: "#f0ad4e", fontSize: fs}} glyph="log-out" />)
    }
    return (loan.quantity_returned === loan.quantity_loaned) ? (
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-circle" />
    ) : (
      <Glyphicon style={{color: "#d9534f", fontSize: fs}} glyph="remove-circle" />
    )
  },

  getLoansPanel() {
    if (this.state.request.status == "A") {
      return (this.state.request.loans.length > 0) ? (
        <Panel header={"Loans"}>
          <Table style={{marginBottom: "0px"}}>
            <thead>
              <tr>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
                <th style={{width:"40%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Loaned</th>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Returned</th>
                <th style={{width:"30%", borderBottom: "1px solid #596a7b"}} className="text-center"></th>
              </tr>
            </thead>
            <tbody>
              { this.state.request.loans.map( (loan, i) => {
                return (
                  <tr key={loan.id}>
                    <td data-th="" className="text-center">
                      { this.getLoanStatusSymbol(loan, "15px") }
                    </td>
                    <td data-th="Item" className="text-left">
                      <a href={"/app/inventory/" + loan.item.name + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                        { loan.item.name }
                      </a>
                    </td>
                    <td data-th="Loaned" className="text-center">
                      { loan.quantity_loaned }
                    </td>
                    <td data-th="Returned" className="text-center">
                      { loan.quantity_returned }
                    </td>
                    <td data-th="Returned" className="text-center">
                      <span className="clickable" style={{color: "#5bc0de", fontSize: "12px", textDecoration: "underline"}} onClick={this.showModal.bind(this, loan)}>
                        Click to modify loan
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Panel>
      ) : (
        <Panel header={"Loans"}>
          <Well bsSize="small" style={{fontSize: "12px"}} className="text-center">
            This request has no associated loans.
          </Well>
        </Panel>
      )
    } else {
      return null
    }
  },

  getDisbursementsPanel() {
    if (this.state.request.status == "A") {
      return (this.state.request.disbursements.length > 0) ? (
        <Panel header={"Disbursements"}>
          <Table style={{marginBottom: "0px"}}>
            <thead>
              <tr>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
                <th style={{width:"80%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              { this.state.request.disbursements.map( (disbursement, i) => {
                return (
                  <tr key={disbursement.id}>
                    <td data-th="Status" className="text-center">
                      <Glyphicon style={{color: "#f0ad4e", fontSize: "15px"}} glyph="log-out" />
                    </td>
                    <td data-th="Item" className="text-left">
                      <a href={"/app/inventory/" + disbursement.item.name + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                        { disbursement.item.name }
                      </a>
                    </td>
                    <td data-th="Quantity" className="text-center">
                      { disbursement.quantity }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Panel>
      ) : (
        <Panel header={"Disbursements"}>
          <Well bsSize="small" style={{fontSize: "12px"}} className="text-center">
            This request has no associated disbursements.
          </Well>
        </Panel>
      )
    } else {
      return null
    }
  },

  get403Forbidden() {
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
  },

  get404NotFound() {
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
  },

  render() {
    if (this.state.forbidden) {
      return this.get403Forbidden()
    } else if (!this.state.requestExists) {
      return this.get404NotFound()
    } else {
      var toprow = (this.state.request.status == "A") ? (
        <Row>
          <Col md={4} xs={12}>
            { this.getRequestInfoPanel() }
          </Col>
          <Col md={4} xs={12}>
            { this.getRequestedItemsPanel() }
          </Col>
          <Col md={4} xs={12}>
            { this.getApprovedItemsPanel() }
          </Col>
        </Row>
      ) : (
        <Row>
          <Col md={5} xs={12}>
            { this.getRequestInfoPanel() }
          </Col>
          <Col md={7} xs={12}>
            { this.getRequestedItemsPanel() }
          </Col>
        </Row>
      )
      return (
        <Grid>
          <Row>
            <Col xs={12}>
              <h3>
                View Request &nbsp;
                <span style={{fontSize:"14px"}}>
                  ID # {this.state.request.request_id}
                </span>
                <span style={{float:"right"}}>
                  {this.getStatusLabel()}
                </span>
              </h3>
              <hr />
            </Col>
          </Row>

          { toprow }

          <hr />

          <Row>
            <Col md={3} xs={4}>
              { this.getLegendPanel() }
            </Col>
            <Col md={5} xs={8}>
              { this.getLoansPanel() }
            </Col>
            <Col md={4} xs={8}>
              { this.getDisbursementsPanel() }
            </Col>
          </Row>

          <LoanModal loan={this.state.loanToModify}
                     request={this.state.request}
                     show={this.state.showModal}
                     onHide={this.hideModal}
                     refresh={this.getRequest} />


        </Grid>
      )
    }
  }
});

export default ManagerRequestsDetail
