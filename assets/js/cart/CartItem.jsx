import React, { Component } from 'react'
import { Well, Panel, Row, Col, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../csrf/DjangoCSRFToken'


class CartItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity: props.cartItem['quantity']
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
    } else {
      console.log("Changing cart item quantity to: " + this.state.quantity)
      this.props.cartItem['quantity'] = this.state.quantity
      console.log(this.props.cartItem)

      var thisobj = this
      $.ajax({
      url:"/api/cart/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        item: thisobj.props.cartItem.item.id,
        owner: thisobj.props.cartItem.owner.id,
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

  render() {
    return (
      <div>
        <Panel header={<h3>{this.props.cartItem['item']['name']}</h3>}>
          <Row>
            <Col xs={2} md={2}>{this.props.cartItem['item']['name']}</Col>
            <Col xs={6} md={6}>
              <Well>{this.props.cartItem['item']['description']}</Well>
            </Col>
            <Col xs={2} md={1}>
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
            <Col xs={1} md={1}>
              <Button bsStyle="primary" onClick={this.changeQuantity} className="quantityButton">Update</Button>
            </Col>
          </Row>
        </Panel>
      </div>
    );
  }
}

export default CartItem
