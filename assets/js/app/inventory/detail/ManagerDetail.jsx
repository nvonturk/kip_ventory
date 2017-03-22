import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, FormGroup, InputGroup, FormControl, Pagination, ControlLabel, Glyphicon, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from '../CreateTransactionsContainer'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../TagMultiSelect'
import Select from 'react-select'

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

      addToCartQuantity: 1,

      transactionQuantity: 0,
      transactionCategory: "Acquisition",
      transactionComment: "",

      stacks: {},

      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },

      modifiedItem: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },

      itemExists: true,
      modifyItem: false,
      showDeleteModal: false,
      showCreateTransactionModal: false
    }
  },

  componentWillMount() {
    var user = this.props.route.user
    this.getItem();
    this.getOutstandingRequests();
    if (user.is_staff || user.is_superuser) {
      this.getTransactions();
    }
    this.getStacks();
    this.getLoans();
    this.getUsers();
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
        loansPageCount: Number(data.num_pages)
      })
    })
  },

  handleItemFormChange(e) {
    e.preventDefault()
    var item = this.state.modifiedItem
    item[e.target.name] = e.target.value
    this.setState({
      modifiedItem: item
    })
  },

  handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/items/" + this.props.params.item_name + "/"
    var data = this.state.modifiedItem
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success: function(response) {
        for (var i=0; i<_this.state.modifiedItem.custom_fields.length; i++) {
          var cf = _this.state.modifiedItem.custom_fields[i]
          var url = "/api/items/" + response.name + "/fields/" + cf.name + "/"
          ajax({
            url: url,
            contentType: "application/json",
            type: "PUT",
            data: JSON.stringify({
              value: cf.value
            }),
            beforeSend: function(request) {
              request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            },
            success:function(response){},
            complete:function(){},
            error:function (xhr, textStatus, thrownError){
              console.log(xhr);
              console.log(textStatus);
              console.log(thrownError);
            }
          });
        }
        var new_url = "/app/inventory/" + response.name + "/"
        window.location.assign(new_url)
      }
    })
  },

  handleTagSelection(tagsSelected) {
    var item = this.state.modifiedItem
    var tags = tagsSelected.split(",")
    if (tags.length == 1) {
      if (tags[0] == "") {
        tags = []
      }
    }
    item.tags = tags
    this.setState({modifiedItem: item});
  },

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="text"
                     value={this.state.modifiedItem.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
          <ControlLabel>{presentation_name}</ControlLabel>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.modifiedItem.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="number"
                     min={min}
                     step={step}
                     value={this.state.modifiedItem.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name} </ControlLabel>
        <FormControl type="number"
                   value={this.state.modifiedItem.custom_fields[i].value}
                   name={field_name}
                   onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  handleCustomFieldChange(i, name, e) {
    var item = this.state.modifiedItem
    item.custom_fields[i].value = e.target.value
    this.setState({
      modifiedItem: item
    })
  },

  getQuantityAndModelNoForm() {
    return (
      <Row>
        <Col xs={8} xs={12}>
          <FormGroup bsSize="small" controlId="model_no">
            <ControlLabel>Model No.</ControlLabel>
            <FormControl disabled={!this.props.route.user.is_superuser && !this.props.route.user.is_staff}
                         type="text"
                         name="model_no"
                         value={this.state.modifiedItem.model_no}
                         onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
        <Col xs={4} xs={12}>
          <FormGroup bsSize="small" controlId="quantity" >
            <ControlLabel>Quantity<span style={{color:"red"}}>*</span></ControlLabel>
            <FormControl disabled={!this.props.route.user.is_superuser}
                         type="number"
                         name="quantity"
                         value={this.state.modifiedItem.quantity}
                         onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
      </Row>
    )
  },

  getCustomFieldForms() {
    return this.state.modifiedItem.custom_fields.map( (field, i) => {

      var field_name = field.name
      var is_private = field.private
      var field_type = field.field_type

      switch(field_type) {
        case "Single":
          return this.getShortTextField(field_name, field_name, i)
          break;
        case "Multi":
          return this.getLongTextField(field_name, field_name, i)
          break;
        case "Int":
          return this.getIntegerField(field_name, field_name, 0, 1, i)
          break;
        case "Float":
          return this.getFloatField(field_name, field_name, i)
          break
        default:
          return null
      }
    })
  },

  handleCartQuantityChange(e) {
    var q = Number(e.target.value)
    if (q > this.state.item.quantity) {
      event.stopPropagation()
    } else {
      this.setState({
        addToCartQuantity: q
      })
    }
  },

  addToCart(e) {
    e.stopPropagation()
    e.preventDefault()
    var url = "/api/items/" + this.state.item.name + "/addtocart/"
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify({
        quantity: _this.state.addToCartQuantity
      }),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var new_url = "/app/inventory/" + _this.state.item.name + "/"
        window.location.assign(new_url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  toggleEdit(e) {
    e.preventDefault()
    var cur = this.state.modifyItem
    if (cur) {
      var itemCopy = JSON.parse(JSON.stringify(this.state.item))
      this.setState({
        modifiedItem: itemCopy,
        modifyItem: false
      })
    } else {
      this.setState({
        modifyItem: true
      })
    }
  },

  deleteItem(e) {
    e.preventDefault()
    var url = "/api/items/" + this.props.params.item_name + "/"
    ajax({
      url: url,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var new_url = "/app/inventory/"
        browserHistory.push(new_url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  getItemModificationForm() {
    var deleteIcon = null
    if (this.props.route.user.is_superuser) {
      deleteIcon = <Glyphicon glyph="trash" style={{paddingLeft: "20px"}} onClick={e => {this.setState({showDeleteModal: true})}}/>
    }
    return (
      <Panel style={{marginBottom: "0px"}}  header={
        <div>
          <span>Product Information</span>
          <span className="clickable" style={{float: "right"}}>
            <Glyphicon glyph="remove" onClick={this.toggleEdit}/>
            { deleteIcon }
          </span>
        </div>} >
        <Form onSubmit={this.handleSubmit}>
          <Row>
            <Col xs={12}>
              <FormGroup bsSize="small" controlId="name">
                <ControlLabel>Name<span style={{color:"red"}}>*</span></ControlLabel>
                <FormControl type="text" name="name" value={this.state.modifiedItem.name} onChange={this.handleItemFormChange}/>
              </FormGroup>
            </Col>
          </Row>

          {this.getQuantityAndModelNoForm()}

          <Row>
            <Col xs={12}>
              <FormGroup bsSize="small" controlId="description">
                <ControlLabel>Description</ControlLabel>
                <FormControl type="text"
                             style={{resize: "vertical", height:"100px"}}
                             componentClass={"textarea"}
                             name="description"
                             value={this.state.modifiedItem.description}
                             onChange={this.handleItemFormChange}/>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <FormGroup bsSize="small" controlId="tags">
                <ControlLabel>Tags</ControlLabel>
                <TagMultiSelect tagsSelected={this.state.modifiedItem.tags} tagHandler={this.handleTagSelection}/>
              </FormGroup>
            </Col>
          </Row>

          {this.getCustomFieldForms()}

          <Row>
            <Col xs={6} smOffset={0}>
              <Button bsSize="small" bsStyle="info" type="submit">Save</Button>
            </Col>
          </Row>

        </Form>
      </Panel>
    )
  },

  getReadOnlyItemInfo() {
    var deleteIcon = null
    if (this.props.route.user.is_superuser) {
      deleteIcon = <Glyphicon glyph="trash" style={{paddingLeft: "20px"}} onClick={e => {this.setState({showDeleteModal: true})}}/>
    }
    return (
      <Panel style={{marginBottom: "0px"}} header={
        <div>
          <span style={{fontSize:"15px"}}>Item Details</span>
          <span className="clickable" style={{float: "right"}}>
            <Glyphicon glyph="pencil" onClick={this.toggleEdit}/>
            { deleteIcon }
          </span>
        </div>} >
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Name</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.name}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Model No.</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.model_no}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Quantity</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.quantity}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Description</th>
              <td style={{border: "1px solid #596a7b"}}>
                <pre style={{fontFamily: '"Lato","Helvetica Neue",Helvetica,Arial,sans-serif',
                             color:"white",
                             fontSize:"12px",
                             border: "0px",
                             backgroundColor:"inherit",
                             margin: "auto", padding: "0px"}}>
                  {this.state.item.description}
                </pre>
              </td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Tags</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.tags.join(", ")}</td>
            </tr>

            {this.state.item.custom_fields.map( (cf, i) => {
              return (
                <tr key={i}>
                  <th style={{paddingRight:"10px", border: "1px solid #596a7b"}}>{cf.name}</th>
                  <td style={{border: "1px solid #596a7b"}}>{cf.value}</td>
                </tr>
              )
            })}

          </tbody>
        </Table>
      </Panel>
    )
  },

  getItemInfoPanel() {
    if (this.state.modifyItem) {
      return this.getItemModificationForm()
    } else {
      return this.getReadOnlyItemInfo()
    }
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
      <Panel style={{marginBottom: "0px"}} header={"Filter Outstanding Requests"}>
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
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-center">Justification</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
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
                  <tr key={request.request_id}>
                    <td data-th="ID" className="text-center" style={{border: "1px solid #596a7b"}}>
                      {request.request_id}
                    </td>
                    <td data-th="Requester" className="text-center" style={{border: "1px solid #596a7b"}}>
                      <span style={{color: "#df691a"}}>{request.requester}</span>
                    </td>
                    <td data-th="Date Opened" className="text-center" style={{border: "1px solid #596a7b"}}>
                      {new Date(request.date_open).toLocaleString()}
                    </td>
                    <td data-th="Requested For" className="text-center" style={{border: "1px solid #596a7b"}}>
                      { label }
                    </td>
                    <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                      {request_item.quantity}
                    </td>
                    <td data-th="Justification" className="text-center" style={{border: "1px solid #596a7b"}}>
                      { request.open_comment }
                    </td>
                    <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                      <a style={{color: "#5bc0de"}} href={"/app/requests/" + request.request_id + "/"}>Click to view</a>
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


      <div className="panel panel-default" style={{marginBottom: "0px"}}>

        <div className="panel-heading">
          Outstanding Requests
        </div>

        <div className="panel-body">
          { requestsTable }
        </div>

        <div className="panel-footer">
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
      <Panel style={{marginBottom: "0px"}} header={"Filter Loans"}>
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
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">User</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Loaned</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Approved by</th>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-center">Admin Comment</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              return (
                <tr key={loan.id}>
                  <td data-th="ID" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.id}
                  </td>
                  <td data-th="User" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <span style={{color: "#df691a"}}>{loan.request.requester}</span>
                  </td>
                  <td data-th="Date Loaned" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(loan.date_loaned).toLocaleString()}
                  </td>
                  <td data-th="Approved by" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <span style={{color: "#df691a"}}>{loan.request.administrator}</span>
                  </td>
                  <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.quantity}
                  </td>
                  <td data-th="Admin Comment" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.request.closed_comment}
                  </td>
                  <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <a style={{color: "#5bc0de"}} href={"/app/loans/" + loan.id + "/"}>Click to view</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <div className="panel panel-default" style={{marginBottom: "0px"}}>

        <div className="panel-heading">
          Outstanding Loans
        </div>

        <div className="panel-body">
          { loanTable }
        </div>

        <div className="panel-footer">
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

  getAddToCartForm() {
    return (
          <Row>
            <Col xs={12}>
              <Form horizontal onSubmit={this.addToCart} style={{marginBottom: "0px"}}>
                <FormGroup bsSize="small">
                  <Col xs={3} componentClass={ControlLabel}>
                    Quantity:
                  </Col>
                  <Col xs={4}>
                    <FormControl type="number"
                                 min={1} max={this.state.item.quantity} step={1}
                                 name="addToCartQuantity"
                                 value={this.state.addToCartQuantity}
                                 onChange={this.handleCartQuantityChange} />
                  </Col>
                  <Col xs={4}>
                    <Button bsStyle="info" bsSize="small" type="submit">Add to cart</Button>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>
    )
  },

  handleTransactionQuantityChange(e) {
    var q = Number(e.target.value)
    if (q < 0) {
      event.stopPropagation()
    } else {
      this.setState({
        transactionQuantity: q
      })
    }
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
          showCreateTransactionModal: false
        }, function() {
          _this.getItem();
          _this.getTransactions();
        });
      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  getCreateTransactionForm() {
    return (
      <Form style={{marginBottom: "0px"}} horizontal onSubmit={e => {e.preventDefault(); e.stopPropagation();}}>
        <FormGroup bsSize="small">
          <Col xs={2} componentClass={ControlLabel}>
            Quantity:
          </Col>
          <Col xs={3}>
            <FormControl style={{fontSize:"10px"}} bsSize="small"
                         type="number"
                         min={0} step={1}
                         name="transactionQuantity"
                         value={this.state.transactionQuantity}
                         onChange={this.handleTransactionQuantityChange} />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col xs={2} componentClass={ControlLabel}>
            Category:
          </Col>
          <Col xs={4}>
            <FormControl style={{fontSize:"10px"}} bsSize="small"
                         componentClass="select"
                         name="transactionCategory"
                         value={this.state.transactionCategory}
                         onChange={e => this.setState({transactionCategory: e.target.value})}>
              <option value="Acquisition">Acquisition</option>
              <option value="Loss">Loss</option>
            </FormControl>
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
        transactionsFilterCategory: selectedCategory.value
      }, this.getTransactions)
    }
  },

  getTransactionFilterPanel() {
    return (
      <Panel style={{marginBottom: "0px"}} header={"Filter Acquisitions and Losses"}>
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

  getTransactionPanel() {
    var transactionsTable = null
    if (this.state.transactions.length > 0) {
      transactionsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Administrator</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Category</th>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "40%", borderBottom: "1px solid #596a7b"}} className="text-center">Comment</th>
            </tr>
          </thead>
          <tbody>
            { this.state.transactions.map( (transaction, i) => {
              var label = (transaction.category == "Acquisition") ? (
                <Label bsSize="small" bsStyle="success">Acquisition</Label>
              ) : (
                <Label bsSize="small" bsStyle="danger">Loss</Label>
              )
              return (
                <tr key={transaction.id}>
                  <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {transaction.id}
                  </td>
                  <td data-th="Administrator" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <span style={{color: "#df691a"}}>{transaction.administrator}</span>
                  </td>
                  <td data-th="Date" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(transaction.date).toLocaleString()}
                  </td>
                  <td data-th="Category" className="text-center" style={{border: "1px solid #596a7b"}}>
                    { label }
                  </td>
                  <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {transaction.quantity}
                  </td>
                  <td data-th="Comment" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {transaction.comment}
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
      <div className="panel panel-default" style={{marginBottom: "0px"}}>

        <div className="panel-heading">
          <Row>
            <Col xs={12}>
              <span style={{fontSize:"15px"}}>Acquisitions and Losses</span>
              <Button bsSize="small" bsStyle="primary"
                      style={{fontSize:"12px", float: "right",
                              verticalAlign:"middle"}}
                      onClick={e => {this.setState({showCreateTransactionModal: true})}}>
                Create
              </Button>
            </Col>
          </Row>
        </div>

        <div className="panel-body">
          { transactionsTable }
        </div>

        <div className="panel-footer">
          <Row>
            <Col md={12}>
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

  getItemStacksPanel() {
    return (
      <Panel header={"Item Tracking"}>
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>
            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Requested</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.requested}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Loaned</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.loaned}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Disbursed</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.disbursed}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>In Cart</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.in_cart}</td>
            </tr>
          </tbody>
        </Table>
      </Panel>
    )
  },

  render() {
    if (this.state.itemExists) {
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
                <Col xs={3}>
                  { this.getAddToCartForm() }
                </Col>
                <Col xs={5}>
                  { this.getItemInfoPanel() }
                </Col>
                <Col xs={4}>
                  { this.getItemStacksPanel() }
                </Col>
              </Row>

              <hr />

              <Row>
                <Col xs={3}>
                  { this.getRequestFilterPanel() }
                </Col>
                <Col xs={9}>
                  { this.getRequestsPanel() }
                </Col>
              </Row>

              <hr />

              <Row>
                <Col xs={3}>
                  { this.getLoanFilterPanel() }
                </Col>
                <Col xs={9}>
                  { this.getLoanPanel() }
                </Col>
              </Row>

              <hr />

              <Row>
                <Col xs={3}>
                  { this.getTransactionFilterPanel() }
                </Col>
                <Col xs={9}>
                  { this.getTransactionPanel() }
                </Col>
              </Row>

              <hr />

            </Col>
          </Row>

          <Modal show={this.state.showDeleteModal} onHide={e => this.setState({showDeleteModal: false})}>
            <Modal.Header closeButton>
              <Modal.Title>Delete Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{fontSize: "14px"}}>Are you sure you want to delete this item?</p>
            </Modal.Body>
            <Modal.Footer>
              <Button bsSize="small" onClick={e => this.setState({showDeleteModal: false})}>Cancel</Button>
              <Button bsStyle="danger" bsSize="small" onClick={this.deleteItem}>Delete</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={this.state.showCreateTransactionModal} onHide={e => this.setState({showCreateTransactionModal: true})}>
            <Modal.Header closeButton>
              <Modal.Title>Log an Acquisition or Loss of Instances</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              { this.getCreateTransactionForm() }
            </Modal.Body>
            <Modal.Footer>
              <Button bsStyle="default" bsSize="small" onClick={e => this.setState({showCreateTransactionModal: true})}>Cancel</Button>
              <Button bsStyle="info"    bsSize="small" onClick={this.createTransaction}>Create</Button>
            </Modal.Footer>
          </Modal>


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
