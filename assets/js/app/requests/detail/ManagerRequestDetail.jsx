import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import { Grid, Row, Col, Button, Nav, Pagination, InputGroup, NavItem, Table, Panel, Label, Form, Tab, Glyphicon, Alert, Well, FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import LoanModal from '../../loans/LoanModal'

import RequestedItemsContainer from './utils/RequestedItemsContainer'
import TabContainer from './utils/TabContainer'

const ManagerRequestsDetail = React.createClass({
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
      },

      itemQuantities: {},
      itemAssets: {},

      requestExists: true,
      forbidden: false,

      errorNodes: {},
      refresh: false
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
        if (response.status == "O") {
          var ris = JSON.parse(JSON.stringify(response.requested_items))
          response.approved_items = ris
        }
        _this.setState({
          request: response,
          refresh: false
        })
        for (var i=0; i<response.requested_items.length; i++) {
          var item = response.requested_items[i].item
          var url = "/api/items/" + item + "/"
          getJSON(url, function(data) {
            var itemQuantities = JSON.parse(JSON.stringify(_this.state.itemQuantities))
            var itemAssets = JSON.parse(JSON.stringify(_this.state.itemAssets))
            itemQuantities[data.name] = Number(data.quantity)
            itemAssets[data.name] = data.has_assets
            _this.setState({
              itemQuantities: itemQuantities,
              itemAssets: itemAssets
            })
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
    var url = "/api/requests/" + this.state.request.id + "/"
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
    var url = "/api/requests/" + this.state.request.id + "/"
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
        _this.setState({
          refresh: true
        }, _this.componentWillMount())
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 400) {
          var response = xhr.responseJSON
          var errNodes = {}
          for (var key in response) {
            if (response.hasOwnProperty(key)) {
              var messages = response[key]
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

  modifyApprovedItem(index, approved_item, assets) {
    if (assets != null) {
      approved_item['assets'] = assets
    }
    var approved_items = JSON.parse(JSON.stringify(this.state.request.approved_items))
    var request = JSON.parse(JSON.stringify(this.state.request))
    approved_items[index] = approved_item
    request['approved_items'] = approved_items
    this.setState({
      request: request
    })
  },

  getModifiableRequestedItems() {
    return (
      <RequestedItemsContainer requestedItems={this.state.request.requested_items}
                               itemAssets={this.state.itemAssets}
                               itemQuantities={this.state.itemQuantities}
                               handleModification={this.modifyApprovedItem}
                               errors={this.state.errorNodes}
                               clearErrors={this.clearErrors}/>
    )
  },

  clearErrors(item_name) {
    var errors = JSON.parse(JSON.stringify(this.state.errorNodes))
    errors[item_name] = null
    this.setState({
      errorNodes: errors
    })
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
                <tr key={ri.item}>
                  <td style={{verticalAlign:"middle"}} data-th="Item" className="text-left">
                    <a className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ri.item + "/")}} style={{color: "#df691a", fontSize:"12px"}}>{ri.item}</a>
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
                  <tr key={ai.item}>
                    <td style={{verticalAlign:"middle"}} data-th="Item" className="text-left">
                      <a className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + ai.item + "/")}} style={{color: "#df691a", fontSize:"12px"}}>{ai.item}</a>
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
      var tabcontainer = (this.state.request.status == "A") ? (
        <TabContainer user={this.props.route.user} request={this.state.request} showHeader={true} refreshRequests={this.getRequest}/>
      ) : null
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
          {tabcontainer}
        </Grid>
      )
    }
  }
});


export default ManagerRequestsDetail
