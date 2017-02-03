import React, { Component } from 'react'
import ShoppingCart from './ShoppingCart'
import $ from 'jquery'

class CartContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
    };

    this.getCartItems = this.getCartItems.bind(this);
  }

  componentWillMount() {
    this.getCartItems()
  }

  getCartItems() {
    var this_ = this;
    $.getJSON("/api/cart/.json", function(data) {
      this_.setState({items: data})
    });
  }

  render() {
    var items = this.state.items
    return <ShoppingCart cartItems={items} />
  }

}

export default CartContainer
