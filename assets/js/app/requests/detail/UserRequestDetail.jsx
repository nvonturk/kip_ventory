import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label, Form, Glyphicon, Alert, Well, FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

import LoanModal from '../../loans/LoanModal'

const UserRequestsDetail = React.createClass({
  getInitialState() {
    return {
      request: {
        id: this.props.params.request_id,
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

      original_items: [],
      requestExists: true,
      forbidden: false,
    }
  },

  componentWillMount() {
    this.getRequest()
  },

  getRequest() {
    var url = "/api/requests/" + this.state.request.id + "/";
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
          request: response,
          original_items: JSON.parse(JSON.stringify(response.requested_items))
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

  getRequestInfoPanel() {
    var administrator = null
    var date_closed = null
    var closed_comment = null
    var hr = null
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
      </Panel>
    )
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
        <Well bsSize="small" className="text-center">There are no items in this request.</Well>
      )
    }
  },

  getRequestedItemsPanel() {
    return (
      <Panel header={"Requested Items"}>
        { this.getReadOnlyRequestedItems() }
      </Panel>
    )
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
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
                <th style={{width:"50%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset</th>
                <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Loaned</th>
                <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Returned</th>
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
                        { loan.item }
                      </a>
                    </td>
                    {(loan.asset == null) ? (
                      <td data-th="Asset" className="text-left">

                      </td>
                    ) : (
                      <td data-th="Asset" className="text-left">
                        { loan.asset }
                      </td>
                    )}
                    <td data-th="Loaned" className="text-center">
                      { loan.quantity_loaned }
                    </td>
                    <td data-th="Returned" className="text-center">
                      { loan.quantity_returned }
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
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
                <th style={{width:"70%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset</th>
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
                        { disbursement.item }
                      </a>
                    </td>
                    {(disbursement.asset == null) ? (
                      <td data-th="Asset" className="text-left">

                      </td>
                    ) : (
                      <td data-th="Asset" className="text-left">
                        { disbursement.asset }
                      </td>
                    )}
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
            <h3>404 - Request with ID {this.state.request.id} not found.</h3>
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
                  ID # {this.state.request.id}
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


        </Grid>
      )
    }
  }
});

export default UserRequestsDetail
