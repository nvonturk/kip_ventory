import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, FormGroup, FormControl, ControlLabel, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from '../CreateTransactionsContainer'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../TagMultiSelect'


const UserDetail = React.createClass({
  getInitialState() {
    return {
      requests: [],
      transactions: [],
      loans: [],
      disbursements: [],
      addToCartQuantity: 1,
      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },
      stacks: {},
      itemExists: true
    }
  },

  componentWillMount() {
    var user = this.props.route.user
    this.getItem();
    this.getOutstandingRequests();
    this.getStacks();
    this.getLoans();
    this.getDisbursements();
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
          item: response
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
    var params = {status: "O", all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results
      })
    })
  },

  getTransactions() {
    var url = "/api/transactions/" + this.props.params.item_name + '/'
    var params = {all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        transactions: data.results
      })
    })
  },

  getLoans() {
    var url = "/api/items/" + this.props.params.item_name + "/loans/"
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        loans: data.results
      })
    })
  },

  getDisbursements() {
    var url = "/api/items/" + this.props.params.item_name + "/disbursements/"
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        disbursements: data.results
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

  getUserItemInfoPanel() {
    return (
      <Panel header={"Product Details"}>
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

  getUserRequestsPanel() {
    var requestsTable = null
    if (this.state.requests.length == 0) {
      requestsTable = (
        <p style={{marginBottom:"0px", fontSize: "12px"}}>
          You have no outstanding requests for this item.
        </p>
      )
    } else {
      requestsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width: "7%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Opened</th>
              <th style={{width: "8%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Type</th>
              <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Justification</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
            </tr>
          </thead>
          <tbody>

            { this.state.requests.map( (request, i) => {
              var request_item = request.requested_items.filter( (ri) => {return (ri.item == this.state.item.name)})[0]
              var label = null
              if (request_item != null) {
                label = (request_item.request_type == "loan") ? (
                  <Label bsStyle="primary">Loan</Label>
                ) : (
                  <Label bsStyle="info">Disbursement</Label>
                )
                return (
                  <tr key={request.request_id}>
                    <td data-th="ID" className="text-center" style={{border: "1px solid #596a7b"}}>
                      {request.request_id}
                    </td>
                    <td data-th="Date Opened" className="text-center" style={{border: "1px solid #596a7b"}}>
                      {new Date(request.date_open).toLocaleDateString()}
                    </td>
                    <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                      {request_item.quantity}
                    </td>
                    <td data-th="Type" className="text-center" style={{border: "1px solid #596a7b"}}>
                      { label }
                    </td>
                    <td data-th="Justification" className="text-left" style={{border: "1px solid #596a7b"}}>
                      {request.open_comment}
                    </td>
                    <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                      <div className="clickable" style={{color: "#5bc0de"}} onClick={e => browserHistory.push("/app/requests/" + request.request_id + "/")}>
                        Request &nbsp; <Glyphicon glyph="new-window" />
                      </div>
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
      <Panel header={"Your Outstanding Requests"}>
        { requestsTable }
      </Panel>
    )
  },

  getUserLoanPanel() {
    var loanTable = null;
    if (this.state.loans.length == 0) {
      loanTable = (
        <p style={{marginBottom:"0px", fontSize: "12px"}}>
          You have no outstanding loans for this item.
        </p>
      )
    } else {
      loanTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
            <th style={{width: "7%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
            <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Loan Date</th>
            <th style={{width: "8%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-left">Justification</th>
            <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Approved by</th>
            <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              return (
                <tr key={loan.id}>
                  <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.id}
                  </td>
                  <td data-th="Loan Date" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(loan.request.date_closed).toLocaleDateString()}
                  </td>
                  <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.quantity}
                  </td>
                  <td data-th="Justification" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.request.open_comment}
                  </td>
                  <td data-th="Approved by" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.request.administrator}
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
      <Panel header={"Your Approved Loans"}>
        { loanTable }
      </Panel>
    )
  },

  // getUserDisbursementPanel() {
  //   var disbursementTable = null
  //   if (this.state.disbursements.length == 0) {
  //     disbursementTable = (
  //       <Well bsSize="small" style={{marginBottom: "0px", fontSize: "12px"}}>
  //         This item has not been disbursed to you.
  //       </Well>
  //     )
  //   } else {
  //     disbursementTable = (
  //       <Table style={{marginBottom:"0px"}}>
  //         <thead>
  //           <tr>
  //           <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
  //           <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
  //           <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Approved</th>
  //           <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity Disbursed</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           { this.state.disbursements.map( (disbursement, i) => {
  //             return (
  //               <tr key={disbursement.id}>
  //                 <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
  //                   {disbursement.id}
  //                 </td>
  //                 <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
  //                   <a style={{color: "#5bc0de"}} href={"/app/disbursements/" + disbursement.id + "/"}>Click to view</a>
  //                 </td>
  //                 <td data-th="Date Approved" className="text-center" style={{border: "1px solid #596a7b"}}>
  //                   {new Date(disbursement.request.date_closed).toLocaleDateString()}
  //                 </td>
  //                 <td data-th="Quantity Disbursed" className="text-center" style={{border: "1px solid #596a7b"}}>
  //                   {disbursement.quantity}
  //                 </td>
  //               </tr>
  //             )
  //           })}
  //         </tbody>
  //       </Table>
  //     )
  //   }
  //   return (
  //     <Panel header={"Approved Disbursements"}>
  //       {disbursementTable}
  //     </Panel>
  //   )
  // },

  getAddToCartForm() {
    var cartMessage = null
    if (this.state.item.in_cart) {
      cartMessage = (
        <p style={{fontSize: "12px"}}>
          This item is currently in <a href="/app/cart/">your cart.</a>
        </p>
      )
    }
    return (
        <Grid fluid>
          <Row>
            <Col md={12}>
              <h3 style={{marginTop: "0px"}}><a href={"/app/inventory/" + this.state.item.name + "/"}>{this.props.params.item_name}</a></h3>
              <hr />
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form horizontal onSubmit={this.addToCart}>
                <FormGroup bsSize="small">
                  <Col md={3} componentClass={ControlLabel}>
                    Quantity:
                  </Col>
                  <Col md={4}>
                    <FormControl type="number"
                                 min={1} max={this.state.item.quantity} step={1}
                                 name="addToCartQuantity"
                                 value={this.state.addToCartQuantity}
                                 onChange={this.handleCartQuantityChange} />
                  </Col>
                  <Col md={4}>
                    <Button bsStyle="info" bsSize="small" type="submit">Add to cart</Button>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>

          <br />

          <Row>
            <Col md={12}>
              { cartMessage }
            </Col>
          </Row>
        </Grid>
    )
  },

  getItemStacksPanel() {
    return (
      <Panel header={"Item Instance Breakdown"}>
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

            <br />
            <br />

            <Row>
              <Col xs={4}>
                { this.getAddToCartForm() }
              </Col>
              <Col xs={5}>
                { this.getUserItemInfoPanel() }
              </Col>
              <Col xs={3}>
                { this.getItemStacksPanel() }
              </Col>
            </Row>

            <hr />
            <br />

            <Row>
              <Col xs={6}>
                { this.getUserRequestsPanel() }
              </Col>
              <Col xs={6}>
                { this.getUserLoanPanel() }
              </Col>
            </Row>

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

export default UserDetail
