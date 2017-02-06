import React, { Component } from 'react'
import { Well, Panel, Row, Col, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'


class CartItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity: props.cartItem['quantity'],
      comment: ""
    }
    this.handleChange = this.handleChange.bind(this);
    this.changeQuantity = this.changeQuantity.bind(this);
  }

  handleChange(event) {
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  }

  changeQuantity(event) {
    if (this.state.quantity == this.props.cartItem['quantity']) {
      console.log("No effect.")
    }
    else if (!Number.isInteger(parseFloat(this.state.quantity)) || parseFloat(this.state.quantity)<=0){
      alert("Must be a positive integer")
    }else {
      console.log("Changing cart item quantity to: " + this.state.quantity)
      this.props.cartItem['quantity'] = this.state.quantity
      console.log(this.props.cartItem)

      var thisobj = this
      $.ajax({
      url:"/api/cart/" + thisobj.props.cartItem.id,
      type: "PUT",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        quantity: thisobj.state.quantity
      },
      success:function(response){},
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");
          console.log(xhr)
          console.log(textStatus)
          console.log(thrownError)
      }
  });

    }
  }

  getPanelHeader(){
    return (
      <div>
      <Row>
        <Col xs={2} md={2}>{this.props.cartItem['item']['name']}</Col>
        <Col xs={6} md={6}>
          <Well>{this.props.cartItem['item']['description']}</Well>
        </Col>
        <Col xs={2} md={2}>
          <FormGroup controlId="formQuantity">
            <ControlLabel>Quantity</ControlLabel>
            <FormControl
              type="number"
              name="quantity"
              value={this.state.quantity}
              placeholder={this.state.quantity}
              onChange={this.handleChange}
            />
          </FormGroup>
        </Col>
        <Col xs={2} md={2}>
            <Row>
              <Col xs={12}>
              <Button bsStyle="primary" block onClick={this.changeQuantity} className="quantityButton">Update</Button>
              </Col>
            </Row>

            <Row>
              <Col xs={12}>
              <Button bsStyle="primary" block onClick={() => this.props.reRender(this.props.cartItem.id)} className="deleteButton">Delete</Button>
              </Col>
            </Row>
        </Col>

      </Row>
      </div>
    )

  }

  render() {
    return (
      <div>
        <Panel collapsible header={this.getPanelHeader()}>
          <div>
            <Row>
            <FormGroup controlId="formOpenComment">
              <ControlLabel>Comment</ControlLabel>
              <FormControl
                type = "text"
                name="comment"
                value={this.state.comment}
                placeholder={this.state.comment}
                onChange={this.handleChange}
              />
            </FormGroup>
              <Button bsStyle="primary" onClick={() => this.props.makeRequest(this.props.cartItem, this.state.comment)} className="requestButton">Make Request</Button>
            </Row>
          </div>
        </Panel>
      </div>
    );
  }
}

export default CartItem
