import React from 'react'
import { } from 'react-bootstrap'

import CartItem from './CartItem'

const ShoppingCart = React.createClass({

  getInitialState() {
    return {};
  },

  render() {
    var cartItems = this.props.cartItems
    return (
      <div>
        {this.props.cartItems.map(function(cartItem, i) {
          return (
            <CartItem key={i} cartItem={cartItem} />
          )
        })}
      </div>
    );
  }
});


export default ShoppingCart;
