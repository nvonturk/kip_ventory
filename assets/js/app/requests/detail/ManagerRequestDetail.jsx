import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import { Grid, Row, Col, Button, Nav, Pagination, InputGroup, NavItem, Table, Panel, Label, Form, Tab, Glyphicon, Alert, Well, FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import LoanModal from '../../loans/LoanModal'

import RequestedItemsContainer from './utils/RequestedItemsContainer'


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

      loans: [],
      loanSearchText: "",
      loanStatus: "",
      loanPage: 1,
      loanPageCount: 1,

      disbursements: [],
      disbursementSearchText: "",
      disbursementPage: 1,
      disbursementPageCount: 1,

      backfills: [],
      backfillSearchText: "",
      backfillStatus: "",
      backfillPage: 1,
      backfillPageCount: 1,

      backfillRequests: [],
      backfillRequestSearchText: "",
      backfillRequestStatus: "",
      backfillRequestPage: 1,
      backfillRequestPageCount: 1,

      itemQuantities: {},
      itemAssets: {},

      requestExists: true,
      forbidden: false,

      showLoanModal: false,
      loanToModify: null,

      errorNodes: {}
    }
  },

  componentWillMount() {
    this.getRequest()
    this.getLoans()
    this.getDisbursements()
    this.getBackfills()
    this.getBackfillRequests()
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
          request: response
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

  getLoans() {
    var url = "/api/requests/" + this.state.request.id + "/loans/"
    var params = {
      item: this.state.loanSearchText,
      status: this.state.loanStatus,
      page: this.state.loanPage,
      itemsPerPage: 5
    }
    var _this = this
    getJSON(url, params, function(data) {
      _this.setState({
        loans: data.results,
        loanPage: 1,
        loanPageCount: data.num_pages
      })
    })
  },

  getDisbursements() {
    var url = "/api/requests/" + this.state.request.id + "/disbursements/"
    var params = {
      item: this.state.disbursementSearchText,
      page: this.state.disbursementPage,
      itemsPerPage: 5
    }
    var _this = this
    getJSON(url, params, function(data) {
      _this.setState({
        disbursements: data.results,
        disbursementPage: 1,
        disbursementPageCount: data.num_pages
      })
    })
  },

  getBackfills() {
    var url = "/api/requests/" + this.state.request.id + "/backfills/"
    var params = {
      item: this.state.backfillSearchText,
      status: this.state.backfillStatus,
      page: this.state.backfillPage,
      itemsPerPage: 5
    }
    var _this = this
    getJSON(url, params, function(data) {
      _this.setState({
        backfills: data.results,
        backfillPage: 1,
        backfillPageCount: data.num_pages
      })
    })
  },

  getBackfillRequests() {
    var url = "/api/requests/" + this.state.request.id + "/backfills/requests/"
    var params = {
      item: this.state.backfillRequestSearchText,
      status: this.state.backfillRequestStatus,
      page: this.state.backfillRequestPage,
      itemsPerPage: 5
    }
    var _this = this
    getJSON(url, params, function(data) {
      _this.setState({
        backfillRequests: data.results,
        backfillRequestPage: 1,
        backfillRequestPageCount: data.num_pages
      })
    })
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
        _this.componentWillMount()
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

  showLoanModal(loan) {
    this.setState({
      showLoanModal: true,
      loanToModify: loan,
    })
  },

  hideModal(e) {
    this.setState({
      showLoanModal: false,
      loanToModify: null,
    })
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

  handleBackfillRequestItemSearch(e) {
    var _this = this
    this.setState({
      backfillRequestSearchText: e.target.value,
      backfillRequestPage: 1
    }, _this.getBackfillRequests)
  },

  handleBackfillRequestStatusSelection(status) {
    var _this = this
    if (status == null) {
      this.setState({
        backfillRequestStatus: "",
      }, _this.getBackfillRequests)
    } else {
      this.setState({
        backfillRequestStatus: status.value
      }, _this.getBackfillRequests)
    }
  },

  getBackfillRequestsFilterPanel() {
    return (
      <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>Search by item name or model number</ControlLabel>
          <InputGroup bsSize="small">
            <FormControl placeholder="Item name or model number"
                         style={{fontSize:"12px"}}
                         type="text" name="backfillRequestSearchText"
                         value={this.state.backfillRequestSearchText}
                         onChange={this.handleBackfillRequestItemSearch}/>
            <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.getBackfillRequests}>
              <Glyphicon glyph="search"/>
            </InputGroup.Addon>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Filter by status</ControlLabel>
          <Select style={{fontSize:"12px"}} name="backfill-status-filter"
                  multi={false}
                  placeholder="Filter by status"
                  value={this.state.backfillRequestStatus}
                  options={[
                    {label: "Outstanding", value: "outstanding"},
                    {label: "Approved", value: "approved"},
                    {label: "Denied", value: "denied"}
                  ]}
                  onChange={this.handleBackfillRequestStatusSelection} />
        </FormGroup>
      </Panel>
    )
  },

  getBackfillRequestsPanel() {
    var backfillRequestTable = null;
    if (this.state.backfillRequests.length == 0) {
      backfillRequestTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}} className="text-center">
          No results.
        </Well>
      )
    } else {
      backfillRequestTable = (
        <Table style={{marginBottom: "0px"}}>
          <thead>
            <tr>
              <th style={{width:"45%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"45%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset Tag</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.backfillRequests.map( (backfill_request, i) => {
              return (
                <tr key={backfill_request.id}>
                  <td data-th="Item">
                    {backfill_request.id}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <div className="panel panel-default" style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>

        <div className="panel-body" style={{minHeight:"220px"}}>
          { backfillRequestTable }
        </div>

        <div className="panel-footer" style={{backgroundColor: "transparent"}}>
          <Row>
            <Col md={12}>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.backfillRequestPageCount}
                          activePage={this.state.backfillRequestPage}
                          onSelect={activeKey => {this.setState({backfillRequestPage: activeKey}, this.getBackfillRequests)}}/>
            </Col>
          </Row>
        </div>

      </div>
    )
  },


  handleBackfillItemSearch(e) {
    var _this = this
    this.setState({
      backfillSearchText: e.target.value,
      backfillPage: 1
    }, _this.getBackfills)
  },

  handleBackfillStatusSelection(status) {
    var _this = this
    if (status == null) {
      this.setState({
        backfillStatus: "",
      }, _this.getBackfills)
    } else {
      this.setState({
        backfillStatus: status.value
      }, _this.getBackfills)
    }
  },

  getBackfillsFilterPanel() {
    return (
      <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>Search by item name or model number</ControlLabel>
          <InputGroup bsSize="small">
            <FormControl placeholder="Item name or model number"
                         style={{fontSize:"12px"}}
                         type="text" name="disbursementSearchText"
                         value={this.state.backfillSearchText}
                         onChange={this.handleBackfillItemSearch}/>
            <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.getBackfills}>
              <Glyphicon glyph="search"/>
            </InputGroup.Addon>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Filter by status</ControlLabel>
          <Select style={{fontSize:"12px"}} name="backfill-status-filter"
                  multi={false}
                  placeholder="Filter by status"
                  value={this.state.backfillStatus}
                  options={[
                    {label: "Awaiting Items", value: "awaiting_items"},
                    {label: "Items Received", value: "satisfied"}
                  ]}
                  onChange={this.handleBackfillStatusSelection} />
        </FormGroup>
      </Panel>
    )
  },

  getBackfillsPanel() {
    var backfillTable = null;
    if (this.state.backfills.length == 0) {
      backfillTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}} className="text-center">
          No results.
        </Well>
      )
    } else {
      backfillTable = (
        <Table style={{marginBottom: "0px"}}>
          <thead>
            <tr>
              <th style={{width:"45%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"45%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset Tag</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.backfills.map( (backfill, i) => {
              return (
                <tr key={backfill.id}>
                  <td data-th="Item">
                    {backfill.id}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <div className="panel panel-default" style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>

        <div className="panel-body" style={{minHeight:"220px"}}>
          { backfillTable }
        </div>

        <div className="panel-footer" style={{backgroundColor: "transparent"}}>
          <Row>
            <Col md={12}>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.backfillPageCount}
                          activePage={this.state.backfillPage}
                          onSelect={activeKey => {this.setState({backfillPage: activeKey}, this.getBackfills)}}/>
            </Col>
          </Row>
        </div>

      </div>
    )
  },



  handleDisbursementItemSearch(e) {
    var _this = this
    this.setState({
      disbursementSearchText: e.target.value,
      disbursmentPage: 1
    }, _this.getDisbursements)
  },

  getDisbursementsFilterPanel() {
    return (
      <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>Search by item name or model number</ControlLabel>
          <InputGroup bsSize="small">
            <FormControl placeholder="Item name or model number"
                         style={{fontSize:"12px"}}
                         type="text" name="disbursementSearchText"
                         value={this.state.disbursementSearchText}
                         onChange={this.handleDisbursementItemSearch}/>
            <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.getDisbursements}>
              <Glyphicon glyph="search"/>
            </InputGroup.Addon>
          </InputGroup>
        </FormGroup>
      </Panel>
    )
  },

  getDisbursementsPanel() {
    if (this.state.request.status == "A") {
      return (this.state.disbursements.length > 0) ? (
        <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
          <Table style={{marginBottom: "0px"}}>
            <thead>
              <tr>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
                <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
                <th style={{width:"50%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset</th>
                <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              { this.state.disbursements.map( (disbursement, i) => {
                return (
                  <tr key={disbursement.id}>
                    <td data-th="Status" className="text-center">
                      <Glyphicon style={{color: "rgb(217, 83, 79)", fontSize: "15px"}} glyph="log-out" />
                    </td>
                    <td data-th="Item" className="text-left">
                      <a href={"/app/inventory/" + disbursement.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
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
        <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
          <Well bsSize="small" style={{fontSize: "12px"}} className="text-center">
            This request has no associated disbursements.
          </Well>
        </Panel>
      )
    } else {
      return null
    }
  },

  getLoanStatusSymbol(loan, fs) {
    return (loan.quantity_returned === loan.quantity_loaned) ? (
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-sign" />
    ) : (
      <Glyphicon style={{color: "#f0ad4e", fontSize: fs}} glyph="exclamation-sign" />
    )
  },

  handleLoanStatusSelection(status) {
    var _this = this
    if (status == null) {
      this.setState({
        loanStatus: "",
      }, _this.getLoans)
    } else {
      this.setState({
        loanStatus: status.value
      }, _this.getLoans)
    }
  },

  handleLoanItemSearch(e) {
    var _this = this
    this.setState({
      loanSearchText: e.target.value,
      loanPage: 1
    }, _this.getLoans)
  },

  getLoansFilterPanel() {
    return (
      <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>Search by item name or model number</ControlLabel>
          <InputGroup bsSize="small">
            <FormControl placeholder="Item name or model number"
                         style={{fontSize:"12px"}}
                         type="text" name="loanSearchText"
                         value={this.state.loanSearchText}
                         onChange={this.handleLoanItemSearch}/>
            <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.getLoans}>
              <Glyphicon glyph="search"/>
            </InputGroup.Addon>
          </InputGroup>
        </FormGroup>
        <FormGroup>
          <ControlLabel>Status</ControlLabel>
          <Select style={{fontSize:"12px"}} name="loans-status-filter"
                  multi={false}
                  placeholder="Filter by status"
                  value={this.state.loanStatus}
                  options={[
                    {label: "Outstanding", value: "outstanding"},
                    {label: "Returned", value: "returned"}
                  ]}
                  onChange={this.handleLoanStatusSelection} />
        </FormGroup>
      </Panel>
    )
  },

  getLoansPanel() {
    var loanTable = null;
    if (this.state.loans.length == 0) {
      loanTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}} className="text-center">
          No results.
        </Well>
      )
    } else {
      loanTable = (
        <Table style={{marginBottom: "0px"}}>
          <thead>
            <tr>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"50%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Loaned</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Returned</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              var editGlyph = (loan.quantity_loaned > loan.quantity_returned) ? (
                <Glyphicon glyph="edit" className="clickable" style={{color: "#5bc0de", fontSize: "12px"}}
                        onClick={this.showLoanModal.bind(this, loan)} />
              ) : null
              return (
                <tr key={loan.id}>
                  <td data-th="" className="text-center">
                    { this.getLoanStatusSymbol(loan, "15px") }
                  </td>
                  <td data-th="Item" className="text-left">
                    <a href={"/app/inventory/" + loan.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
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
                  <td data-th="" className="text-center">
                    { editGlyph }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <div className="panel panel-default" style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>

        <div className="panel-body" style={{minHeight:"220px"}}>
          { loanTable }
        </div>

        <div className="panel-footer" style={{backgroundColor: "transparent"}}>
          <Row>
            <Col md={12}>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.loanPageCount}
                          activePage={this.state.loanPage}
                          onSelect={activeKey => {this.setState({loanPage: activeKey}, this.getLoans)}}/>
            </Col>
          </Row>
        </div>

      </div>
    )
  },

  getTabContainer() {
    return (this.state.request.status == "A") ? (
      <Panel header={"View loans, disbursements, and backfills associated with this request."}>
        <Tab.Container id="tabs-with-dropdown" defaultActiveKey={1} >
          <Row className="clearfix">
            <Col sm={12}>
              <Nav bsStyle="tabs" style={{borderBottom: "1px solid #596a7b"}}>
                <NavItem eventKey={1} style={{borderBottom: "1px solid #596a7b"}}>
                  Loans
                </NavItem>
                <NavItem eventKey={2} style={{borderBottom: "1px solid #596a7b"}}>
                  Disbursements
                </NavItem>
                <NavItem eventKey={3} style={{borderBottom: "1px solid #596a7b"}}>
                  Backfill Requests
                </NavItem>
                <NavItem eventKey={4} style={{borderBottom: "1px solid #596a7b"}}>
                  Backfills
                </NavItem>
              </Nav>
            </Col>
            <Col sm={12}>
              <Tab.Content animation>

                <Tab.Pane eventKey={1} style={{padding: "15px"}}>
                  <Row>
                    <Col xs={3} style={{paddingLeft: "0px"}}>
                      { this.getLoansFilterPanel() }
                    </Col>
                    <Col xs={9} style={{paddingRight: "0px"}}>
                      { this.getLoansPanel() }
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey={2} style={{padding: "15px"}}>
                  <Row>
                    <Col xs={3} style={{paddingLeft: "0px"}}>
                      { this.getDisbursementsFilterPanel() }
                    </Col>
                    <Col xs={9} style={{paddingRight: "0px"}}>
                      { this.getDisbursementsPanel() }
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey={3} style={{padding: "15px"}}>
                  <Row>
                    <Col xs={3} style={{paddingLeft: "0px"}}>
                      { this.getBackfillRequestsFilterPanel() }
                    </Col>
                    <Col xs={9} style={{paddingRight: "0px"}}>
                      { this.getBackfillRequestsPanel() }
                    </Col>
                  </Row>
                </Tab.Pane>

                <Tab.Pane eventKey={4} style={{padding: "15px"}}>
                  <Row>
                    <Col xs={3} style={{paddingLeft: "0px"}}>
                      { this.getBackfillsFilterPanel() }
                    </Col>
                    <Col xs={9} style={{paddingRight: "0px"}}>
                      { this.getBackfillsPanel() }
                    </Col>
                  </Row>
                </Tab.Pane>

              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Panel>
    ) : null
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

          { this.getTabContainer() }

          <LoanModal loan={this.state.loanToModify}
                     request={this.state.request}
                     show={this.state.showLoanModal}
                     onHide={this.hideModal}
                     refresh={this.componentWillMount.bind(this)}
                     user={this.props.route.user}/>


        </Grid>
      )
    }
  }
});


export default ManagerRequestsDetail
