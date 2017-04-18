import React, { Component } from 'react'
import { Grid, Row, Col, Tabs, Tab, OverlayTrigger, Popover, Nav, NavItem,
         Button, Modal, Table, Form, FormGroup, InputGroup, FormControl,
         Pagination, ControlLabel, Glyphicon, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../TagMultiSelect'
import Select from 'react-select'
import LoanModal from '../../loans/LoanModal'

import ItemInfoPanel from './utils/ItemInfoPanel'
import ItemStacksPanel from './utils/ItemStacksPanel'
import ItemAssetPanel from './utils/ItemAssetPanel'

import AssetSelector from './AssetSelector'

const ITEMS_PER_PAGE = 5;

const ManagerDetail = React.createClass({
  getInitialState() {
    return {
      requests: [],
      requestsPage: 1,
      requestsPageCount: 1,
      requestsFilterUser: "",
      requestsFilterType: "",

      transactions: [],
      transactionsPage: 1,
      transactionsPageCount: 1,
      transactionsFilterAdmin: "",
      transactionsFilterCategory: "",

      loans: [],
      loansPage: 1,
      loansPageCount: 1,
      loansFilterUser: "",

      users: [],
      admins: [],
      custom_fields: [],


      transactionQuantity: 0,
      transactionCategory: "Acquisition",
      transactionComment: "",

      stacks: {},

      item: {
        name: "",
        model_no: "",
        quantity: 0,
        minimum_stock: 0,
        tags: [],
        description: "",
        has_assets: false
      },

      itemExists: true,

      showCreateTransactionModal: false,

      showLoanModal: false,
      loanToShow: null,

      assetPage: 1,
      assetPageCount: 1,
      assets: [],
      selectedAssets: [],


      errorNodes: {}
    }
  },

  componentWillMount() {
    this.refresh()
  },

  refresh() {
    var user = this.props.route.user
    this.getItem();
    this.getCustomFields();
    this.getOutstandingRequests();
    if (user.is_staff || user.is_superuser) {
      this.getTransactions();
    }
    this.getStacks();
    this.getLoans();
    this.getUsers();
  },

  getCustomFields() {
    var url = "/api/fields/"
    var _this = this
    var params = {"all": true}
    getJSON(url, params, function(data) {
      var custom_fields = data.results.map( (field, i) => {
        return ({"name": field.name, "value": "", "field_type": field.field_type})
      });
      _this.setState({
        custom_fields: custom_fields
      })
    })
  },

  getStacks() {
    var url = "/api/items/" + this.props.params.item_name + "/stacks/"
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        stacks: data
      })
    })
  },

  getUsers() {
    var url = "/api/users/"
    var _this = this;
    getJSON(url, function(data) {
      var users = data.map((user, i) => {
        return {
          label: user.username,
          value: user.username
        }
      })
      var admins = data.filter( (user) => {
        return (user.is_staff || user.is_superuser)
      }).map( (user, i) => {
        return {
          label: user.username,
          value: user.username
        }
      })
      _this.setState({
        users: users,
        admins: admins
      })
    })
  },

  getAssets() {
    var url = "/api/items/" + this.props.params.item_name + "/assets/"
    var params = {
      page: this.state.assetPage,
      itemsPerPage: ITEMS_PER_PAGE,
      status: "In Stock"
    }
    var _this = this;
    getJSON(url, params, function(data) {
      console.log(data)
      _this.setState({
        assets: data.results,
        assetPageCount: Number(data.num_pages),
      })
    })
  },

  getItem() {
    var url = "/api/items/" + this.props.params.item_name + "/";
    var _this = this;
    ajax({
      url: url,
      contentType: "application/json",
      type: "GET",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var responseCopy = JSON.parse(JSON.stringify(response))
        _this.setState({
          item: response,
          modifiedItem: responseCopy
        })
        if(response.has_assets){
          _this.getAssets();
        }
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 404) {
          _this.setState({
            itemExists: false
          })
        }
      }
    });
  },

  getOutstandingRequests() {
    var url = "/api/items/" + this.props.params.item_name + "/requests/";
    var params = {
      page: this.state.requestsPage,
      itemsPerPage: ITEMS_PER_PAGE,
      user: this.state.requestsFilterUser,
      type: this.state.requestsFilterType
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results,
        requestsPageCount: Number(data.num_pages)
      })
    })
  },

  getTransactions() {
    var url = "/api/items/" + this.props.params.item_name + "/transactions/";
    var params = {
      page: this.state.transactionsPage,
      itemsPerPage: ITEMS_PER_PAGE,
      administrator: this.state.transactionsFilterAdmin,
      category: this.state.transactionsFilterCategory
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        transactions: data.results,
        transactionsPageCount: Number(data.num_pages)
      })
    })
  },

  getLoans() {
    var url = "/api/items/" + this.props.params.item_name + "/loans/"
    var params = {
      page: this.state.loansPage,
      itemsPerPage: ITEMS_PER_PAGE,
      user: this.state.loansFilterUser
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        loans: data.results,
        loansPageCount: Number(data.num_pages),
      })
    })
  },

  handleTransactionQuantityChange(e) {
    var q = Number(e.target.value)
    if (q < 0) {
      e.stopPropagation()
    } else {
      this.setState({
        transactionQuantity: q
      })
    }
  },

  handleTransactionCategoryChange(e) {
    var cat = e.target.value
    var tq = this.state.transactionQuantity
    this.setState({
      transactionQuantity: tq,
      transactionCategory: cat
    })
  },

  getStatusSymbol(loan, fs) {
    return (loan.quantity_returned === loan.quantity_loaned) ? (
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-sign" />
    ) : (
      <Glyphicon style={{color: "rgb(240, 173, 78)", fontSize: fs}} glyph="exclamation-sign" />
    )
  },

  createTransaction(e) {
    e.preventDefault();
    e.stopPropagation();
    var _this = this
    var data = {
      item: this.state.item.name,
      quantity: this.state.transactionQuantity,
      category: this.state.transactionCategory,
      comment: this.state.transactionComment
    }
    if(this.state.item.has_assets && this.state.transactionCategory == "Loss"){
      data = {
        item: this.state.item.name,
        quantity: this.state.transactionQuantity,
        category: this.state.transactionCategory,
        comment: this.state.transactionComment,
        assets: this.state.selectedAssets.map((asset, i) => {return asset.tag}),
      }
    }
    ajax({
      url: "/api/transactions/",
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          transactionComment: "",
          transactionQuantity: 0,
          transactionCategory: "Acquisition",
          showCreateTransactionModal: false,
          selectedAssets: [],
        }, function() {
          _this.getItem();
          _this.getTransactions();
          _this.getStacks();
        });
      },
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 400) {
          var response = xhr.responseJSON
          var errNodes = JSON.parse(JSON.stringify(_this.state.errorNodes))
          for (var key in response) {
            if (response.hasOwnProperty(key)) {
              var node = <span key={key} className="help-block">{response[key][0]}</span>
              errNodes[key] = node
            }
          }
          _this.setState({
            errorNodes: errNodes
          })
        }
      }
    });
  },

  getValidationState(key) {
    return (this.state.errorNodes[key] == null) ? null : "error"
  },

  handleRequestUserSelection(selectedUser) {
    if (selectedUser == null) {
      this.setState({
        requestsFilterUser: "",
      }, this.getOutstandingRequests)
    } else {
      this.setState({
        requestsFilterUser: selectedUser.value
      }, this.getOutstandingRequests)
    }
  },

  handleRequestTypeSelection(selectedType) {
    if (selectedType == null) {
      this.setState({
        requestsFilterType: "",
      }, this.getOutstandingRequests)
    } else {
      this.setState({
        requestsFilterType: selectedType.value
      }, this.getOutstandingRequests)
    }
  },

  getRequestFilterPanel() {
    return (
      <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>User</ControlLabel>
          <Select style={{fontSize:"12px"}} name="requests-user-filter"
                  multi={false}
                  placeholder="Filter by user"
                  value={this.state.requestsFilterUser}
                  options={this.state.users}
                  onChange={this.handleRequestUserSelection} />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Type of Request</ControlLabel>
          <Select style={{fontSize:"12px"}} name="requests-type-filter"
                  multi={false}
                  placeholder="Filter by request type"
                  value={this.state.requestsFilterType}
                  options={[
                    {
                      label: "Loan",
                      value: "loan",
                    },
                    {
                      label: "Disbursement",
                      value: "disbursement"
                    }
                  ]}
                  onChange={this.handleRequestTypeSelection} />
        </FormGroup>
      </Panel>
    )
  },

  getRequestsPanel() {
    var requestsTable = null
    var message = (
      <span>
        There are no outstanding requests for this item.
      </span>
    )
    var user = this.state.requestsFilterUser
    var type = this.state.requestsFilterType
    if (user.length == 0) {
      if (type.length > 0) {
        message = <span>There are no outstanding requests for {type}.</span>
      }
    } else {
      if (type.length == 0) {
        message = <span><span style={{color: "#df691a"}}>{user}</span> has no outstanding requests for this item.</span>
      } else {
        message = <span><span style={{color: "#df691a"}}>{user}</span> has no outstanding requests for {type}.</span>
      }
    }
    if (this.state.requests.length == 0) {
      requestsTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}} className="text-center">
          { message }
        </Well>
      )
    } else {
      requestsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Requester</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Requested</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Requested For</th>
              <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-left">Justification</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Request Details</th>
            </tr>
          </thead>
          <tbody>

            { this.state.requests.map( (request, i) => {
              var request_items = request.requested_items.filter( (ri) => {return (ri.item == this.state.item.name)})
              if (request_items.length == 1) {
                var request_item = request_items[0]
                var label = null
                if (request_item.request_type == 'loan') {
                  label = <Label bsStyle="primary">Loan</Label>
                } else if (request_item.request_type == 'disbursement') {
                  label = <Label bsStyle="info">Disbursement</Label>
                }
                return (
                  <tr key={request.id}>
                    <td data-th="ID" className="text-center" >
                      <span style={{fontSize:"11px"}}>{request.id}</span>
                    </td>
                    <td data-th="Requester" className="text-center" >
                      <span style={{fontSize:"11px", color: "#df691a"}}>{request.requester}</span>
                    </td>
                    <td data-th="Date Opened" className="text-center" >
                      <span style={{fontSize:"11px"}}>{new Date(request.date_open).toLocaleString()}</span>
                    </td>
                    <td data-th="Requested For" className="text-center" >
                      { label }
                    </td>
                    <td data-th="Quantity" className="text-center" >
                      <span style={{fontSize:"11px"}}>{request_item.quantity}</span>
                    </td>
                    <td data-th="Justification" className="text-left" >
                      <span style={{fontSize:"11px"}}>{ request.open_comment }</span>
                    </td>
                    <td data-th="Link" className="text-center" >
                      <a style={{fontSize:"11px", color: "#5bc0de"}} className="clickable" href={"/app/requests/" + request.id + "/"}>Click to view</a>
                    </td>
                  </tr>
                )
              } else {
                return null
              }
            })}
          </tbody>
        </Table>
      )
    }
    return (


      <div className="panel panel-default" style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>

        <div className="panel-body" style={{minHeight:"220px"}}>
          { requestsTable }
        </div>

        <div className="panel-footer" style={{backgroundColor: "transparent"}}>
          <Row>
            <Col md={12}>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.requestsPageCount}
                          activePage={this.state.requestsPage}
                          onSelect={activeKey => {this.setState({requestsPage: activeKey}, this.getOutstandingRequests)}}/>
            </Col>
          </Row>
        </div>

      </div>

    )
  },

  handleLoanUserSelection(selectedUser) {
    if (selectedUser == null) {
      this.setState({
        loansFilterUser: "",
      }, this.getLoans)
    } else {
      this.setState({
        loansFilterUser: selectedUser.value
      }, this.getLoans)
    }
  },

  getLoanFilterPanel() {
    return (
      <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>User</ControlLabel>
          <Select style={{fontSize:"12px"}} name="loans-user-filter"
                  multi={false}
                  placeholder="Filter by user"
                  value={this.state.loansFilterUser}
                  options={this.state.users}
                  onChange={this.handleLoanUserSelection} />
        </FormGroup>
      </Panel>
    )
  },

  getLoanLegendPanel() {
    return (
      <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>
      <h5>Legend</h5>
      <hr />
        <Row style={{display: "flex"}}>
          <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            <Glyphicon style={{color: "rgb(240, 173, 78)", fontSize:"18px"}} glyph="exclamation-sign" />
          </Col>
          <Col md={9}>
            <p style={{marginBottom: "0px", fontSize: "12px"}}>This loan is outstanding.</p>
          </Col>
        </Row>
      </Panel>
    )
  },

  getLoanPanel() {
    var loanTable = null;
    var message = (
      <span>
        There are no outstanding loans for this item.
      </span>
    )
    if (this.state.loansFilterUser.length > 0) {
      message = (
        <span>
          <span><span style={{color: "#df691a"}}>{this.state.loansFilterUser}</span> has no outstanding loans for this item.</span>
        </span>
      )
    }
    if (this.state.loans.length == 0) {
      loanTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}} className="text-center">
          { message }
        </Well>
      )
    } else {
      loanTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width:"5%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">User</th>
              {(this.state.item.has_assets) ? (
                <th style={{width:"5%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset</th>
              ) : (
                <th style={{width:"5%", borderBottom: "1px solid #596a7b"}} className="text-left"></th>
              )}
              <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Loaned</th>
              <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Request</th>
              <th style={{width:"30%", borderBottom: "1px solid #596a7b"}} className="text-left">Admin Comment</th>
              <th style={{width:" 5%", borderBottom: "1px solid #596a7b"}} className="text-center">Loaned</th>
              <th style={{width:" 5%", borderBottom: "1px solid #596a7b"}} className="text-center">Returned</th>
              <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              return (
                <tr key={loan.id}>
                  <td data-th="Status" className="text-center" >
                    { this.getStatusSymbol(loan, "15px") }
                  </td>
                  <td data-th="User" className="text-center" >
                    <span style={{fontSize: "11px", color: "#df691a"}}>{loan.request.requester}</span>
                  </td>
                  {(this.state.item.has_assets) ? (
                    <td data-th="Asset" className="text-center" >
                      <span style={{fontSize: "12px"}}>{loan.asset}</span>
                    </td>
                  ) : (
                    <td data-th="Asset" className="text-center" >
                    </td>
                  )}
                  <td data-th="Date Loaned" className="text-center" >
                    <span style={{fontSize: "11px"}}>{new Date(loan.date_loaned).toLocaleString()}</span>
                  </td>
                  <td data-th="Request" className="text-center" >
                    <span className="clickable"
                          style={{fontSize: "11px", textDecoration: "underline", color: "#5bc0de"}}
                          onClick={e => {browserHistory.push("/app/requests/" + loan.request.id + "/")}}>
                        Click to view
                    </span>
                  </td>
                  <td data-th="Admin Comment" className="text-left" >
                    <span style={{fontSize: "11px"}}>{loan.request.closed_comment}</span>
                  </td>
                  <td data-th="Loaned" className="text-center" >
                    <span style={{fontSize: "12px"}}>{loan.quantity_loaned}</span>
                  </td>
                  <td data-th="Returned" className="text-center" >
                    <span style={{fontSize: "12px"}}>{loan.quantity_returned}</span>
                  </td>
                  <td data-th="" className="text-center" >
                    <Glyphicon glyph="edit" className="clickable"
                          style={{fontSize: "14px", color: "#5bc0de"}}
                          onClick={e => {this.setState({showLoanModal: true, loanToShow: loan})}} />
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
                          bsSize="small" items={this.state.loansPageCount}
                          activePage={this.state.loansPage}
                          onSelect={activeKey => {this.setState({loansPage: activeKey}, this.getLoans)}}/>
            </Col>
          </Row>
        </div>

      </div>
    )
  },

  handlePageSelect(page){
    var _this = this
    this.setState({
      assetPage: page,
    }, _this.getAssets)
  },

  isAssetSelected(tag){
    for(var i = 0 ; i < this.state.selectedAssets.length ; i++){
      if(this.state.selectedAssets[i].tag == tag){
        return true
      }
    }
    return false
  },

  handleAssetSelection(e, index){
    var newArray = this.state.selectedAssets
    newArray.push(this.state.assets[index])
    this.setState({
      "selectedAssets" : newArray,
    })

  },

  handleAssetRemoval(e, index){
    var asset = this.state.assets[index]
    for(var i = 0 ; i < this.state.selectedAssets.length ; i++){
      if(this.state.selectedAssets[i].tag == asset.tag){
        var newArray = this.state.selectedAssets
        newArray.splice(i, 1)
        this.setState({
          "selectedAssets": newArray,
        })
      }
    }
  },


  getCreateTransactionForm() {
    return (
      <div>
      <Form style={{marginBottom: "0px"}} horizontal onSubmit={e => {e.preventDefault(); e.stopPropagation();}}>
        <FormGroup bsSize="small" validationState={this.getValidationState("quantity")}>
          <Col xs={2} componentClass={ControlLabel}>
            Quantity:
          </Col>
          <Col xs={2}>
            <FormControl style={{fontSize:"10px"}} bsSize="small"
                         type="number"
                         min={0} step={1}
                         name="transactionQuantity"
                         value={this.state.transactionQuantity}
                         onChange={this.handleTransactionQuantityChange} />
          </Col>
          <Col xs={2} componentClass={ControlLabel}>
            Category:
          </Col>
          <Col xs={4}>
            <FormControl style={{fontSize:"10px"}} bsSize="small"
                         componentClass="select"
                         name="transactionCategory"
                         value={this.state.transactionCategory}
                         onChange={this.handleTransactionCategoryChange}>
              <option value="Acquisition">Acquisition</option>
              <option value="Loss">Loss</option>
            </FormControl>
          </Col>
          <Col xs={12} className="text-center">
            { this.state.errorNodes['transactionQuantity'] }
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col xs={2} componentClass={ControlLabel}>
            Description:
          </Col>
          <Col xs={8}>
            <FormControl type="text"
                         style={{resize: "vertical", height:"100px"}}
                         componentClass={"textarea"}
                         value={this.state.transactionComment}
                         name="transactionComment"
                         onChange={e => {this.setState({transactionComment: e.target.value})}} />
            <HelpBlock>Enter a description of this acquisition or loss.</HelpBlock>
          </Col>
        </FormGroup>
      </Form>
      {(this.state.transactionCategory == "Loss") ? (
        <AssetSelector assets={this.state.assets}
                       selectedAssets={this.state.selectedAssets}
                       lossQuantity={this.state.transactionQuantity}
                       handleAssetRemoval={this.handleAssetRemoval}
                       handleAssetSelection={this.handleAssetSelection}
                       isAssetSelected={this.isAssetSelected}
                       pageCount={this.state.assetPageCount}
                       page={this.state.assetPage}
                       handlePageSelect={this.handlePageSelect}/>
      ) : (
        <div>
        </div>
      )}
      </div>
    )
  },

  handleTransactionAdminSelection(selectedUser) {
    if (selectedUser == null) {
      this.setState({
        transactionsFilterAdmin: "",
      }, this.getTransactions)
    } else {
      this.setState({
        transactionsFilterAdmin: selectedUser.value
      }, this.getTransactions)
    }
  },

  handleTransactionCategorySelection(selectedCategory) {
    if (selectedCategory == null) {
      this.setState({
        transactionsFilterCategory: "",
      }, this.getTransactions)
    } else {
      this.setState({
        transactionsFilterCategory: selectedCategory.value,
      }, this.getTransactions)
    }
  },

  getTransactionFilterPanel() {
    return (
      <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>
        <h5>Refine Results</h5>
        <hr />
        <FormGroup>
          <ControlLabel>Administrator</ControlLabel>
          <Select style={{fontSize:"12px"}} name="transactions-admin-filter"
                  multi={false}
                  placeholder="Filter by administrator"
                  value={this.state.transactionsFilterAdmin}
                  options={this.state.admins}
                  onChange={this.handleTransactionAdminSelection} />
        </FormGroup>
        <FormGroup>
          <ControlLabel>Type of Request</ControlLabel>
          <Select style={{fontSize:"12px"}} name="transactions-category-filter"
                  multi={false}
                  placeholder="Filter by type"
                  value={this.state.transactionsFilterCategory}
                  options={[
                    {
                      label: "Acquisition",
                      value: "Acquisition",
                    },
                    {
                      label: "Loss",
                      value: "Loss"
                    }
                  ]}
                  onChange={this.handleTransactionCategorySelection} />
        </FormGroup>
      </Panel>
    )
  },

  getTransactionAssetsPopover(tx) {
    var content = (tx.assets.length > 0) ? (
      tx.assets.join(", ")
    ) : (
      "N/A"
    )
    return (
      <Popover style={{maxWidth:"200px"}} id="tag-popover" >
        <Col sm={12}>
          <div style={{fontSize:"10px"}}>
            <p style={{marginBottom: "2px"}}>{content}</p>
          </div>
        </Col>
      </Popover>
    )
  },

  getTransactionPanel() {
    var transactionsTable = null
    var tableHeader = (this.state.item.has_assets) ? (
      <tr>
        <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
        <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Administrator</th>
        <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date</th>
        <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Category</th>
        <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
        <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset Tags</th>
        <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-left">Comment</th>
      </tr>
    ) : (
      <tr>
        <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
        <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Administrator</th>
        <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date</th>
        <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Category</th>
        <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
        <th style={{width: "40%", borderBottom: "1px solid #596a7b"}} className="text-left">Comment</th>
      </tr>
    )
    if (this.state.transactions.length > 0) {
      transactionsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            { tableHeader }
          </thead>
          <tbody>
            { this.state.transactions.map( (transaction, i) => {
              var label = (transaction.category == "Acquisition") ? (
                <Label bsSize="small" bsStyle="success">Acquisition</Label>
              ) : (
                <Label bsSize="small" bsStyle="danger">Loss</Label>
              )
              var assetCol = (this.state.item.has_assets) ? (
                <td data-th="Asset Tags" className="text-center" >
                  <OverlayTrigger rootClose trigger={["hover", "focus"]} placement="right" overlay={this.getTransactionAssetsPopover(transaction)}>
                    <Glyphicon glyph="tags" className="clickable"/>
                  </OverlayTrigger>
                </td>
              ) : null
              return (
                <tr key={transaction.id}>
                  <td data-th="ID" className="text-center" >
                    <span style={{fontSize:"11px"}}>{transaction.id}</span>
                  </td>
                  <td data-th="Administrator" className="text-center" >
                    <span style={{color: "#df691a"}}>{transaction.administrator}</span>
                  </td>
                  <td data-th="Date" className="text-center" >
                    <span style={{fontSize:"11px"}}>{new Date(transaction.date).toLocaleString()}</span>
                  </td>
                  <td data-th="Category" className="text-center" >
                    { label }
                  </td>
                  <td data-th="Quantity" className="text-center" >
                    <span style={{fontSize:"11px"}}>{transaction.quantity}</span>
                  </td>
                  { assetCol }
                  <td data-th="Comment" className="text-left" >
                    <span style={{fontSize:"11px"}}>{transaction.comment}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      transactionsTable = (
        <Well bsSize="small" style={{marginBottom: "0px", fontSize: "12px"}} className="text-center">
          There have not been any acquisitions or losses of this item.
        </Well>
      )
    }
    return (
      <div className="panel panel-default" style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>

        <div className="panel-body" style={{minHeight:"220px"}}>
          { transactionsTable }
        </div>

        <div className="panel-footer" style={{backgroundColor: "transparent"}}>
          <Row>
            <Col md={12}>
            <Button bsSize="small" bsStyle="primary"
                    style={{float: "left", verticalAlign:"middle"}}
                    onClick={this.showTransactionModal}>
              Log an Acquisition or Loss
            </Button>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.transactionsPageCount}
                          activePage={this.state.transactionsPage}
                          onSelect={activeKey => {this.setState({transactionsPage: activeKey}, this.getTransactions)}}/>
            </Col>
          </Row>
        </div>

      </div>
    )
  },

  showTransactionModal(e) {
    this.setState({
      assetPage: 1,
      selectedAssets: [],
      showCreateTransactionModal: true,
      transactionComment: "",
      transactionQuantity: 0,
      transactionCategory: "Acquisition",
    })
  },

  hideTransactionModal(e) {
    this.setState({
      assetPage: 1,
      selectedAssets: [],
      showCreateTransactionModal: false,
      transactionComment: "",
      transactionQuantity: 0,
      transactionCategory: "Acquisition",
    })
  },


  allowLossTransaction(){
    if(this.state.selectedAssets.length < this.state.transactionQuantity && this.state.item.has_assets && this.state.transactionCategory == "Loss"){
      return false;
    }
    if(this.state.transactionQuantity == 0){
      return false;
    }
    return true;
  },

  render() {
    if (this.state.itemExists) {
      var request = (this.state.loanToShow == null) ? null : this.state.loanToShow.request
      return (
        <Grid>
          <Row>
            <Col xs={12}>
              <Row>
                <Col xs={12}>
                  <h3>{this.props.params.item_name}</h3>
                  <hr />
                </Col>
              </Row>

              <Row>
                <Col md={4} sm={5} xs={11}>
                  <ItemInfoPanel user={this.props.route.user} item={this.state.item} customFields={this.state.custom_fields} />
                </Col>
                <Col md={4} sm={7} xs={13}>
                  <ItemStacksPanel item={this.state.item} stacks={this.state.stacks} />
                </Col>
                <Col md={4} sm={12} xs={12}>
                  <ItemAssetPanel item={this.state.item} refresh={this.refresh} user={this.props.route.user}/>
                </Col>
              </Row>

              <hr />

              <Panel>
                <Tab.Container id="tabs-with-dropdown" defaultActiveKey={1} >
                  <Row className="clearfix">
                    <Col sm={12}>
                      <Nav bsStyle="tabs" style={{borderBottom: "1px solid #596a7b"}}>
                        <NavItem eventKey={1} style={{borderBottom: "1px solid #596a7b"}}>
                          Outstanding Requests
                        </NavItem>
                        <NavItem eventKey={2} style={{borderBottom: "1px solid #596a7b"}}>
                          Outstanding Loans
                        </NavItem>
                        <NavItem eventKey={3} style={{borderBottom: "1px solid #596a7b"}}>
                          Acquisitions and Losses
                        </NavItem>
                      </Nav>
                    </Col>
                    <Col sm={12}>
                      <Tab.Content animation>

                        <Tab.Pane eventKey={1} style={{padding: "15px"}}>
                          <Row>
                            <Col xs={3} style={{paddingLeft: "0px"}}>
                              { this.getRequestFilterPanel() }
                            </Col>
                            <Col xs={9} style={{paddingRight: "0px"}}>
                              { this.getRequestsPanel() }
                            </Col>
                          </Row>
                        </Tab.Pane>

                        <Tab.Pane eventKey={2} style={{padding: "15px"}}>
                          <Row>
                            <Col xs={3} style={{paddingLeft: "0px"}}>
                              { this.getLoanFilterPanel() }
                              { this.getLoanLegendPanel() }
                            </Col>
                            <Col xs={9} style={{paddingRight: "0px"}}>
                              { this.getLoanPanel() }
                            </Col>
                          </Row>
                        </Tab.Pane>

                        <Tab.Pane eventKey={3} style={{padding: "15px"}}>
                          <Row>
                          <Col xs={3} style={{paddingLeft: "0px"}}>
                            { this.getTransactionFilterPanel() }
                          </Col>
                            <Col xs={9} style={{paddingRight: "0px"}}>
                              { this.getTransactionPanel() }
                            </Col>
                          </Row>
                        </Tab.Pane>
                      </Tab.Content>
                    </Col>
                  </Row>
                </Tab.Container>
              </Panel>

              <hr />

            </Col>
          </Row>

          <Modal show={this.state.showCreateTransactionModal} onHide={this.hideTransactionModal}>
            <Modal.Header closeButton>
              <Modal.Title>Log an Acquisition or Loss of Instances</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              { this.getCreateTransactionForm() }
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="default" bsSize="small" onClick={this.hideTransactionModal}>Cancel</Button>
              <Button bsStyle="info"    bsSize="small" onClick={this.createTransaction} disabled={!this.allowLossTransaction()}>Create</Button>
            </Modal.Footer>
          </Modal>



          <LoanModal show={this.state.showLoanModal}
                     loan={this.state.loanToShow}
                     request={request}
                     onHide={e => {this.setState({showLoanModal: false, loanToShow: null})}}
                     refresh={e => {this.setState({showLoanModal: false, loanToShow: null}); this.refresh();}}
                     user={this.props.route.user}/>

        </Grid>
      )
    } else {
      return (
        <Grid>
          <Row>
            <Col>
              <h3>404 - Item '{this.props.params.item_name}' not found.</h3>
              <hr />
            </Col>
          </Row>
        </Grid>
      )
    }
  }

})

export default ManagerDetail
