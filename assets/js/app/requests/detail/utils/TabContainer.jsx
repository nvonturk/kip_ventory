import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import { Grid, Row, Col, Button, Nav, Pagination, InputGroup, NavItem, Table, Panel, Label, Form, Tab, Glyphicon, Alert, Well, FormControl, FormGroup, HelpBlock, ControlLabel } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import LoanModal from '../../../loans/LoanModal'
import BackfillRequestModal from '../../../backfills/BackfillRequestModal'

const TabContainer = React.createClass({
  getInitialState() {
    return {
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

      showLoanModal: false,
      loanToModify: null,

      showBackfillRequestModal: false,
      backfillRequestToModify: null,
    }
  },

  componentWillMount() {
    this.getLoans()
    this.getDisbursements()
    this.getBackfills()
    this.getBackfillRequests()
  },

  updateLoanToModify() {
    if (this.state.loanToModify != null) {
      var _this = this;
      var url = "/api/loans/" + this.state.loanToModify.id + "/"
      getJSON(url, null, function(data) {
        _this.setState({
          loanToModify: data
        })
      })
    }
  },

  updateBackfillRequestToModify() {
    if (this.state.backfillRequestToModify != null) {
      var _this = this;
      var url = "/api/backfillrequests/" + this.state.backfillRequestToModify.id + "/"
      getJSON(url, null, function(data) {
        _this.setState({
          backfillRequestToModify: data
        })
      })
    }
  },

  componentWillReceiveProps(nProps) {
    if (nProps.refresh) {
      this.componentWillMount()
    }
  },

  getLoans() {
    var url = "/api/requests/" + this.props.request.id + "/loans/"
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
        loanPageCount: data.num_pages
      })
    })
  },

  getDisbursements() {
    var url = "/api/requests/" + this.props.request.id + "/disbursements/"
    var params = {
      item: this.state.disbursementSearchText,
      page: this.state.disbursementPage,
      itemsPerPage: 5
    }
    var _this = this
    getJSON(url, params, function(data) {
      _this.setState({
        disbursements: data.results,
        disbursementPageCount: data.num_pages
      })
    })
  },

  getBackfills() {
    var url = "/api/requests/" + this.props.request.id + "/backfills/"
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
        backfillPageCount: data.num_pages
      })
    })
  },

  getBackfillRequests() {
    var url = "/api/requests/" + this.props.request.id + "/backfills/requests/"
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
        backfillRequestPageCount: data.num_pages
      })
    })
  },

  showLoanModal(loan) {
    var _this = this
    var url = "/api/loans/" + loan.id + "/"
    getJSON(url, null, function(data) {
      _this.setState({
        showLoanModal: true,
        loanToModify: data
      })
    })
  },

  hideLoanModal(e) {
    this.setState({
      showLoanModal: false,
      loanToModify: null,
    })
  },

  showBackfillRequestModal(backfillRequest) {
    var _this = this
    var url = "/api/backfillrequests/" + backfillRequest.id + "/"
    getJSON(url, null, function(data) {
      _this.setState({
        showBackfillRequestModal: true,
        backfillRequestToModify: data
      })
    })
  },

  hideBackfillRequestModal(e) {
    this.setState({
      showBackfillRequestModal: false,
      backfillRequestToModify: null,
    })
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
        backfillRequestPage: 1
      }, _this.getBackfillRequests)
    } else {
      this.setState({
        backfillRequestStatus: status.value,
        backfillRequestPage: 1
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
                    {label: "Outstanding", value: "O"},
                    {label: "Approved", value: "A"},
                    {label: "Denied", value: "D"}
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
              <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset Tag</th>
              <th style={{width:"30%", borderBottom: "1px solid #596a7b"}} className="text-left">Requester Comment</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">View Request</th>
            </tr>
          </thead>
          <tbody>
            { this.state.backfillRequests.map( (backfill_request, i) => {
              var brStatus = (backfill_request.status == "O") ? (
                <Label bsSize="small" bsStyle="warning">Outstanding</Label>
              ) : ((backfill_request.status == "A") ? (
                <Label bsSize="small" bsStyle="success">Approved</Label>
              ) : (
                <Label bsSize="small" bsStyle="danger">Denied</Label>
              ))
              var editGlyph = (backfill_request.status == "O") ? (
                <Glyphicon glyph="edit" className="clickable"
                           style={{color: "#5bc0de", fontSize: "12px"}}
                           onClick={this.showBackfillRequestModal.bind(this, backfill_request)}/>
              ) : null
              var asset = (backfill_request.asset == null) ? ("N/A") : (backfill_request.asset)
              return (
                <tr key={backfill_request.id}>
                  <td data-th="Item" className="text-left">
                    <a href={"/app/inventory/" + backfill_request.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                      { backfill_request.item }
                    </a>
                  </td>
                  <td data-th="Asset Tag" className="text-center">
                    {asset}
                  </td>
                  <td data-th="Requester Comment" className="text-left">
                    {backfill_request.requester_comment}
                  </td>
                  <td data-th="Quantity" className="text-center">
                    {backfill_request.quantity}
                  </td>
                  <td data-th="Status" className="text-center">
                    { brStatus }
                  </td>
                  <td data-th="View Request" className="text-center">
                    <a className="clickable" style={{color: "#5bc0de", fontSize: "12px"}}
                       onClick={this.showBackfillRequestModal.bind(this, backfill_request)}>
                       Click to view
                    </a>
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
        backfillPage: 1
      }, _this.getBackfills)
    } else {
      this.setState({
        backfillStatus: status.value,
        backfillPage: 1
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
                    {label: "Fulfilled", value: "satisfied"}
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
              <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset Tag</th>
              <th style={{width:"25%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Approved</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">View Backfill</th>
            </tr>
          </thead>
          <tbody>
            { this.state.backfills.map( (backfill, i) => {
              var brStatus = (backfill.status == "satisfied") ? (
                <Label bsSize="small" bsStyle="success">Fulfilled</Label>
              ) : (
                <Label bsSize="small" bsStyle="warning">Awaiting Items</Label>
              )
              var viewBackfill = (backfill.status == "awaiting_items") ? (
                <a className="clickable" style={{color: "#5bc0de", fontSize: "12px"}} onClick={e => {console.log(backfill)}}>
                   Click to view
                </a>
              ) : null
              var asset = (backfill.asset == null) ? ("N/A") : (backfill.asset)
              return (
                <tr key={backfill.id}>
                  <td data-th="Item" className="text-left">
                    <a href={"/app/inventory/" + backfill.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                      { backfill.item }
                    </a>
                  </td>
                  <td data-th="Asset Tag" className="text-center">
                    {asset}
                  </td>
                  <td data-th="Date Approved" className="text-center">
                    { new Date(backfill.date_created).toLocaleString() }
                  </td>
                  <td data-th="Quantity" className="text-center">
                    {backfill.quantity}
                  </td>
                  <td data-th="Status" className="text-center">
                    { brStatus }
                  </td>
                  <td data-th="View Backfill" className="text-center">
                    { viewBackfill }
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
    var disbursementsTable = null;
    if (this.state.disbursements.length == 0) {
      disbursementsTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}} className="text-center">
          No results.
        </Well>
      )
    } else {
      disbursementsTable = (
        <Table style={{marginBottom: "0px"}}>
          <thead>
            <tr>
              <th style={{width:"30%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"30%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset Tag</th>
              <th style={{width:"25%", borderBottom: "1px solid $506a7b"}} className="text-center">Date Disbursed</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.disbursements.map( (disbursement, i) => {
              var asset = (disbursement.asset == null) ? ("N/A") : (disbursement.asset)
              return (
                <tr key={disbursement.id}>
                  <td data-th="Item" className="text-left">
                    <a href={"/app/inventory/" + disbursement.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                      { disbursement.item }
                    </a>
                  </td>
                  <td data-th="Asset Tag" className="text-center">
                    { asset }
                  </td>
                  <td data-th="Date Disbursed" className="text-center">
                    { new Date(disbursement.date).toLocaleString() }
                  </td>
                  <td data-th="Quantity" className="text-center">
                    { disbursement.quantity }
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

        <div className="panel-body">
          { disbursementsTable }
        </div>

        <div className="panel-footer" style={{backgroundColor: "transparent"}}>
          <Row>
            <Col md={12}>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.disbursementPageCount}
                          activePage={this.state.disbursementPage}
                          onSelect={activeKey => {this.setState({disbursementPage: activeKey}, this.getDisbursements)}}/>
            </Col>
          </Row>
        </div>

      </div>
    )
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
        loanPage: 1
      }, _this.getLoans)
    } else {
      this.setState({
        loanStatus: status.value,
        loanPage: 1
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
              <th style={{width:"25%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset Tag</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Loaned</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Returned</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Backfill Request</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Modify Loan</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              var editGlyph = (loan.quantity_loaned > loan.quantity_returned) ? (
                <Glyphicon glyph="edit" className="clickable" style={{color: "#5bc0de", fontSize: "12px"}}
                        onClick={this.showLoanModal.bind(this, loan)} />
              ) : null
              var status = (loan.quantity_loaned > loan.quantity_returned) ? (
                <Label bsSize="small" bsStyle="warning">Outstanding</Label>
              ) : (
                <Label bsSize="small" bsStyle="success">Returned</Label>
              )
              var backfillRequestLink = (loan.outstanding_backfill_request != null) ? (
                <a className="clickable" style={{color: "#5bc0de", fontSize: "12px"}}
                   onClick={this.showBackfillRequestModal.bind(this, loan.outstanding_backfill_request)}>
                   Click to view
                </a>
              ) : <span style={{fontSize: "12px"}}>None</span>
              var asset = (loan.asset == null) ? ("N/A") : (loan.asset)
              return (
                <tr key={loan.id}>
                  <td data-th="Item" className="text-left">
                    <a href={"/app/inventory/" + loan.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                      { loan.item }
                    </a>
                  </td>
                  <td data-th="Asset Tag" className="text-center">
                    { asset }
                  </td>
                  <td data-th="Loaned" className="text-center">
                    { loan.quantity_loaned }
                  </td>
                  <td data-th="Returned" className="text-center">
                    { loan.quantity_returned }
                  </td>
                  <td data-th="Status" className="text-center">
                    { status }
                  </td>
                  <td data-th="Backfill Request" className="text-center">
                    { backfillRequestLink }
                  </td>
                  <td data-th="Modify Loan" className="text-center">
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

        <div className="panel-body">
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

  getPanelStyle() {
    return (this.props.index === this.props.expanded) ? (
      {margin:"10px 0px", boxShadow: "0px 0px 5px 2px #485563"}
    ) : (
      {margin:"0px"}
    )
  },

  getTabContainer() {
    var header = (this.props.showHeader) ? ("View loans, disbursements, and backfills associated with this request.") : null
    return (this.props.request.status == "A") ? (
      <Panel header={header} collapsible
             defaultExpanded={false}
             expanded={this.props.expanded === this.props.index}
             style={this.getPanelStyle()}>
        <Tab.Container id="tabs-with-dropdown" defaultActiveKey={1} >
          <Row className="clearfix">
            <Col sm={12}>
              <Nav bsStyle="tabs" style={{borderBottom: "1px solid #596a7b"}}>
                <NavItem eventKey={1} style={{borderBottom: "1px solid #596a7b", fontSize: "14px"}}>
                  Loans
                </NavItem>
                <NavItem eventKey={2} style={{borderBottom: "1px solid #596a7b", fontSize: "14px"}}>
                  Disbursements
                </NavItem>
                <NavItem eventKey={3} style={{borderBottom: "1px solid #596a7b", fontSize: "14px"}}>
                  Backfill Requests
                </NavItem>
                <NavItem eventKey={4} style={{borderBottom: "1px solid #596a7b", fontSize: "14px"}}>
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

        <LoanModal loan={this.state.loanToModify}
                   request={this.props.request}
                   show={this.state.showLoanModal}
                   onHide={this.hideLoanModal}
                   refresh={this.componentWillMount.bind(this)}
                   updateLoan={this.updateLoanToModify}
                   user={this.props.user}/>

       <BackfillRequestModal backfillRequest={this.state.backfillRequestToModify}
                             request={this.props.request}
                             show={this.state.showBackfillRequestModal}
                             onHide={this.hideBackfillRequestModal}
                             refresh={this.componentWillMount.bind(this)}
                             updateBackfillRequest={this.updateBackfillRequestToModify}
                             user={this.props.user}/>
      </Panel>

    ) : null
  },

  render() {
    return this.getTabContainer()
  }

})

export default TabContainer
