import React, { Component } from 'react'
import ShoppingCart from './ShoppingCart'
import $ from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'


class CartContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
    };

    this.getCartItems = this.getCartItems.bind(this);
    this.reRender = this.reRender.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
  }

  componentWillMount() {
    this.getCartItems()
  }

  makeRequest(cartItem){
    var thisobj = this
    $.ajax({
    url:"/api/requests/",
    type: "POST",
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    },
    data: {
      item: cartItem.item.id,
      requester: cartItem.owner.id,
      quantity: cartItem.quantity
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
    thisobj.reRender(cartItem.id)
  }

  reRender(itemID) {
    var thisobj = this
    $.ajax({
    url:"/api/cart/" + itemID,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    },
    success:function(response){},
    complete:function(){      var items = thisobj.state.items.filter(item => (item.id != itemID))
          console.log("DELETED SUCCESSFULLY")
          console.log(items)
          thisobj.setState({
            items: items
          })
        },
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
    }
    });

    // this.getCartItems()
  }

  getCartItems() {
    var thisobj = this
    $.getJSON("/api/cart/.json", function(data) {
      thisobj.setState({items: data,})
    });
  }

  render() {
    var items = this.state.items
    return <ShoppingCart reRender={this.reRender} makeRequest={this.makeRequest} cartItems={items} />
  }

}

export default CartContainer
