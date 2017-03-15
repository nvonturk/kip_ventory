import React from 'react'
import { Grid, Row, Col, Table, FormGroup, FormControl, ControlLabel, Form, Panel, Button, Well } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import CartItemTableRow from './CartItemTableRow'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

const CartContainer = React.createClass({

  getInitialState() {
    return {
      cartItems: [],
      requestType: "disbursement",
      openReason: ""
    }
  },

  componentWillMount() {
    this.getCartItems()
  },

  getCartItems() {
    var url = '/api/cart/'
    var _this = this
    getJSON(url, null, function(data) {
      _this.setState({
        cartItems: data,
      })
    })
  },

  createRequest() {
    var _this = this
    var url = "/api/requests/"
    var data = {
      request_type: this.state.requestType,
      open_comment: this.state.openReason
    }
    ajax({
      url:"/api/requests/",
      contentType: "application/json",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: JSON.stringify(data),
      success:function(response){
        _this.setState({
          cartItems: [],
          showSuccessNode: true,
          successNode: (
            <div>
              <br />
              <br />
              <Well>
                <p>Successfully generated request with ID # {response.request_id}</p>
                <p><a href={"/app/requests/" + response.request_id + "/"}>Click here to view your request.</a></p>
              </Well>
            </div>)
        })
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){}
    });
  },

  handleChange(event) {
    event.preventDefault()
    this.setState({
      [event.target.name]: event.target.value
    })
  },

  getSuccessNode() {
    return this.state.showSuccessNode ? this.state.successNode : null
  },

  getCartView() {
    return ((this.state.cartItems.length > 0) || this.state.showSuccessNode) ? (
      <Row>
        <Col sm={7}>
          <Row>
            <Col sm={12}>
              <Table hover>
                <thead>
                  <tr>
                    <th style={{width:"40%"}} className="text-left">Item Information</th>
                    <th style={{width:"10%"}} className="text-center">Model No.</th>
                    <th style={{width:"10%"}} className="text-center">Available</th>
                    <th style={{width:"10%" }} className="spacer"></th>
                    <th style={{width:"10%"}} className="text-center"/>
                    <th style={{width:"5%" }} className="spacer"></th>
                    <th style={{width:"10%"}}  className="text-center">Quantity</th>
                    <th style={{width:"5%" }} className="spacer"></th>
                  </tr>
                </thead>
                <tbody>
                  {this.state.cartItems.map( (ci, i) => {
                    return (<CartItemTableRow key={ci.item.name} cartItem={ci} />)
                  })}
                </tbody>
              </Table>
            </Col>
          </Row>

          <Row>
            <Col sm={8} smOffset={2} className="text-center">
              { this.getSuccessNode() }
            </Col>
          </Row>
        </Col>

        <Col sm={5}>
          <Panel>
            <Row>
              <Col sm={12}>
                <h4>Checkout</h4>
                <hr />
              </Col>
            </Row>
            <Row>
              <Col sm={12}>

                <Form horizontal>

                  <FormGroup bsSize="small">
                    <Col sm={3} componentClass={ControlLabel}>
                      Request Type
                    </Col>
                    <Col sm={8}>
                      <FormControl className="text-center"
                                   style={{fontSize:"10px"}}
                                   componentClass="select"
                                   name="requestType"
                                   value={this.state.requestType}
                                   onChange={this.handleChange}>
                        <option value="disbursement">Disbursement</option>
                        <option value="loan">Loan</option>
                      </FormControl>
                    </Col>
                  </FormGroup>

                  <FormGroup bsSize="small">
                    <Col sm={3} componentClass={ControlLabel}>
                      Reason
                    </Col>
                    <Col sm={8}>
                      <FormControl type="text"
                                 style={{resize: "vertical", height:"75px"}}
                                 componentClass={"textarea"}
                                 value={this.state.openReason}
                                 name="openReason"
                                 onChange={this.handleChange} />
                    </Col>
                  </FormGroup>

                  <FormGroup bsSize="small">
                    <Col smOffset={3} sm={4}>
                      <Button disabled={this.state.openReason.length <= 0} bsSize="small" type="button" bsStyle="info" onClick={this.createRequest}>
                        Request Items
                      </Button>
                    </Col>
                  </FormGroup>

                </Form>

              </Col>
            </Row>
          </Panel>
        </Col>
      </Row>
    ) : (
      <Row>
        <Col sm={6} smOffset={3}>
            <p className="text-center">
            <br />
              There doesn't seem to be anything in your cart. <br /> <br />
              Add some items from the <a href="/app/inventory/">Inventory</a> to get started.
            </p>
        </Col>
      </Row>
    )
  },

  render() {
    return (
      <Grid>

        <Row>
          <Col sm={12}>
            <h3>Shopping Cart</h3>
            <hr />
          </Col>
        </Row>

        { this.getCartView() }


      </Grid>
    )
  }

})

export default CartContainer
