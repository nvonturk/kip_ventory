import React from 'react'
import { Grid, Row, Col, Table, FormGroup, FormControl, HelpBlock, ControlLabel, Form, Panel, Button, Well } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import CartItemTableRow from './CartItemTableRow'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

const CartContainer = React.createClass({

  getInitialState() {
    return {
      cartItems: [],
      requestType: "disbursement",
      openReason: "",
      showConfirmationNode: false,
      confirmationNode: null
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

  createRequest(e) {
    e.preventDefault()
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
          showConfirmationNode: true,
          confirmationNode: _this.getRequestConfirmationNode(response)
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

  getRequestConfirmationNode(request) {
    return (
      <Well style={{marginBottom: "0px"}} bsSize="small" className="text-center">
        <p style={{margin:"5px 0px"}}>Successfully generated request with ID # {request.id}</p>
        <p style={{margin:"5px 0px"}}><a href={"/app/requests/" + request.id + "/"}>Click here to view your request.</a></p>
      </Well>)
  },

  getPanelContent() {
    return this.state.showConfirmationNode ? (
      this.state.confirmationNode
    ) : (
      <Table hover condensed style={{marginBottom: "0px"}}>
        <thead>
          <tr>
            <th style={{width:"20%"}} className="text-left">Item</th>
            <th style={{width:"10%"}} className="spacer" />
            <th style={{width:"10%"}} className="text-center">Model No.</th>
            <th style={{width:"10%"}} className="text-center">Available</th>
            <th style={{width:"10%" }} className="text-left">Tags</th>
            <th style={{width:"10%"}} className="text-center"></th>
            <th style={{width:"17%"}} className="text-center">Request Type</th>
            <th style={{width:"5%" }} className="spacer" />
            <th style={{width:"8%" }} className="text-center">Quantity</th>
          </tr>
          <tr>
            <th colSpan={9}>
              <hr style={{margin: "auto"}} />
            </th>
          </tr>
        </thead>
        <tbody>
          {this.state.cartItems.map( (ci, i) => {
            return (<CartItemTableRow key={ci.item.name} cartItem={ci} />)
          })}
        </tbody>
      </Table>
    )
  },

  getCartView() {
    return ((this.state.cartItems.length > 0) || this.state.showConfirmationNode) ? (
      <Row>
        <Col sm={12}>
          <Row>
            <Col sm={8}>
              <Panel>
                { this.getPanelContent() }
              </Panel>
            </Col>

            <Col sm={4}>
              <Well>

                <h4>Checkout</h4>
                <hr />
                <Form onSubmit={this.createRequest}>
                  <FormGroup bsSize="small">
                    <ControlLabel>Justification</ControlLabel>
                    <FormControl type="text"
                                 style={{resize: "vertical", height:"100px"}}
                                 componentClass="textarea"
                                 name="openReason"
                                 disabled={this.state.showConfirmationNode}
                                 value={this.state.openReason}
                                 onChange={this.handleChange} />
                    <HelpBlock>Enter a brief justification for requesting these items.</HelpBlock>
                  </FormGroup>
                  <FormGroup>
                    <Button disabled={this.state.showConfirmationNode || this.state.openReason.length == 0} bsSize="small" bsStyle="info" type="submit">Generate request</Button>
                  </FormGroup>
                </Form>
              </Well>
            </Col>

          </Row>

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
            <h3>Your Cart</h3>
            <hr />
          </Col>
        </Row>

        { this.getCartView() }

      </Grid>
    )
  }

})

export default CartContainer
