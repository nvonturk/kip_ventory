import React from 'react'
import { Row, Col, Button } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import CartItem from './CartItem'

const ShoppingCart = React.createClass({

  getInitialState() {
    return {};
  },

  render() {
    var cartItems = this.props.cartItems
    return (
      <Row>
        <Col xs={10} xsOffset={1}>
        {this.props.cartItems.map(function(cartItem, i) {
          return (
            <Row key = {cartItem.id}>
              <CartItem reRender={this.props.reRender} makeRequest={this.props.makeRequest} cartItem={cartItem} />
            </Row>
          )}.bind(this))}
        </Col>
      </Row>
    );
  }
});


export default ShoppingCart;
