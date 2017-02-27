import React, { Component } from 'react'
import { Grid, Row, Col } from 'react-bootstrap'
import CartItem from './CartItem'
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

  makeRequest(cartItem, comment){
    // CHeck to make sure the quantity is possible
    var thisobj = this
    if(cartItem.item.quantity < cartItem.quantity){
      alert("Quantity Exceeds Capacity. Current quantity for " + cartItem.item.name + " is: " + cartItem.item.quantity)
    }
    else if(!comment){
      alert("Justification Needed for Request")
    }
    else{
      var d = new Date();
      var n = d.toISOString();
      $.ajax({
      url:"/api/requests/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        item: cartItem.item,
        quantity: cartItem.quantity,
        open_reason: comment,
      },
      success:function(response){},
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");
      }
  });
      thisobj.reRender(cartItem.id)
    }

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

          thisobj.setState({
            items: items
          })
        },
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");

    }
    });

  }

  getCartItems() {
    var thisobj = this
    $.getJSON("/api/cart/", function(data) {
      thisobj.setState({items: data,})
    });
  }

  render() {
    var items = this.state.items
    return (
      <Grid>
        <Row>
          <Col xs={12}>
          {this.state.items.map(function(cartItem, i) {
            return (
              <Row key={cartItem.id}>
                <CartItem reRender={this.reRender} makeRequest={this.makeRequest} cartItem={cartItem} />
              </Row>
            )}.bind(this))}
          </Col>
        </Row>
      </Grid>
    )
  }

}

export default CartContainer
