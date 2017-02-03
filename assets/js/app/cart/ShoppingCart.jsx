import React from 'react'
import { Row, Col } from 'react-bootstrap'

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
            <CartItem key={i} cartItem={cartItem} />
          )
        })}
        </Col>
      </Row>
    );
  }
});


export default ShoppingCart;
