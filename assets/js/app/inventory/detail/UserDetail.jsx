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
      requestsFilterType: "",

      loans: [],
      loansPage: 1,
      loansPageCount: 1,

      addToCartQuantity: 1,

      stacks: {},

      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },

      itemExists: true,
    }
  },

  componentWillMount() {
    var user = this.props.route.user
    this.getItem();
    this.getOutstandingRequests();
    this.getStacks();
    this.getLoans();
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
        _this.setState({
          item: response,
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

  getLoans() {
    var url = "/api/items/" + this.props.params.item_name + "/loans/"
    var params = {
      page: this.state.loansPage,
      itemsPerPage: ITEMS_PER_PAGE
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        loans: data.results,
        loansPageCount: Number(data.num_pages)
      })
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

  getItemInfoPanel() {
    return (
      <Panel style={{marginBottom: "0px"}} header={"Item Details"}>
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
        You have no outstanding requests for this item.
      </span>
    )
    var type = this.state.requestsFilterType
    if (type.length > 0) {
      message = <span>You have no outstanding requests for {type}.</span>
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

  getLoanFilterPanel() {
    return (
      <Panel style={{marginBottom: "0px"}} header={"Filter Loans"}>
        <p style={{fontSize:"12px"}}>View all of your current outstanding loans in the panel to the right.</p>
      </Panel>
    )
  },

  getLoanPanel() {
    var loanTable = null;
    var message = (
      <span>
        You have no outstanding loans for this item.
      </span>
    )
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
          Your Outstanding Loans
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

            </Col>
          </Row>

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
