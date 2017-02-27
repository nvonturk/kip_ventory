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
    this.setState({ [event.target.name]: event.target.value });
  }

  changeQuantity(event) {
    if (!Number.isInteger(parseInt(this.state.quantity,10)) || parseInt(this.state.quantity)<=0){
      alert("Must be a positive integer")
    }else {
      this.props.cartItem['quantity'] = this.state.quantity
      console.log("/api/cart/" + this.props.cartItem.item.name + "/")
      var thisobj = this
      $.ajax({
      url:"/api/cart/" + this.props.cartItem.item.name + "/",
      type: "PUT",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        quantity: thisobj.state.quantity,
      },
      success:function(response){},
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");
      }
  });

    }
  }

  getPanelHeader(){
    return (
      <div>
      <Row>
        <Col xs={2} md={2}>
          <Well>{this.props.cartItem['item']['name']}</Well>
        </Col>
        <Col xs={6} md={6}>
          <Well>{this.props.cartItem['item']['description']}</Well>
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
              <Row>
                <Col xs={3} md={3}>
                  <FormGroup controlId="formQuantity">
                    <ControlLabel>Quantity (click Update to set value)</ControlLabel>
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
                  <Button bsStyle="primary" block onClick={this.changeQuantity} className="quantityButton">Update</Button>
                </Col>
              </Row>
              <Row>
                <Col xs={6} md={6}>
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
                </Col>
              </Row>
              <Row>
                <Col xs={2} md={2}>
                  <Button bsStyle="primary" block onClick={() => this.props.reRender(this.props.cartItem.id)} className="deleteButton">Delete</Button>
                </Col>
              </Row>
            </Row>
          </div>
        </Panel>
      </div>
    );
  }
}

export default CartItem
