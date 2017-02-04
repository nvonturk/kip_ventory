import React, { Component } from 'react'
import ShoppingCart from './ShoppingCart'
import $ from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'


class CartContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
    };

    this.getCartItems = this.getCartItems.bind(this);
    this.reRender = this.reRender.bind(this);
  }

  componentWillMount() {
    this.getCartItems()
  }

  reRender(id) {
    console.log("RERENDER")
    console.log(id)
    $.ajax({
    url:"/api/cart/" + id,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
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
    return <ShoppingCart reRender={this.reRender} cartItems={items} />
  }

}

export default CartContainer
