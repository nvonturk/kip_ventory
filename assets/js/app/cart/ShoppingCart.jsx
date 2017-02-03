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
            <div key={i}>
            <Row>
              <CartItem cartItem={cartItem} />
              <Button bsStyle="primary" onClick={() => this.props.reRender(cartItem.id)} className="deleteButton">Delete</Button>
            </Row>
            </div>
          )
        }.bind(this))}
        </Col>
      </Row>
    );
  }
});


export default ShoppingCart;
