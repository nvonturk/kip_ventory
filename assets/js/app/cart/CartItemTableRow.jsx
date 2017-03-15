import React from 'react'
import { Grid, Row, Col, Button, Panel, FormGroup, FormControl, Tooltip, OverlayTrigger} from 'react-bootstrap'
import { browserHistory } from 'react-router'
import ItemTableDetail from '../inventory/ItemTableDetail'
// import DatePicker from 'react-datepicker'
// import moment from 'moment'
import { ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

// require('react-datepicker/dist/react-datepicker.css');
// require('react-datepicker/dist/react-datepicker-cssmodules.css');



const CartItemTableRow = React.createClass({

  getInitialState() {
    return {
      item: this.props.cartItem.item,
      quantity: this.props.cartItem.quantity,
    }
  },


  handleQuantityChange(e) {
    var q = Number(e.target.value)
    if (q > this.state.item.quantity) {
      e.stopPropagation()
    } else {
      this.setState({quantity: Number(e.target.value)}, this.updateCartItem)
    }
  },

  updateCartItem() {
    var url = "/api/cart/" + this.state.item.name + "/"
    var _this = this
    var data = {}
    data['quantity'] = this.state.quantity
    ajax({
      url: url,
      type: "PUT",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: data,
      traditional: true,
      success:function(response){},
      complete:function(){},
      error:function (xhr, textStatus, thrownError){console.log(xhr)}
    })
  },

  deleteCartItem() {
    var url = "/api/cart/" + this.state.item.name + "/"
    var _this = this
    ajax({
      url: url,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){},
      complete:function(){},
      error:function (xhr, textStatus, thrownError){console.log(xhr)}
    });
  },

  render() {
    return (
      <tr style={{height:"75px"}}>
        <td data-th="Item Information">
          <Row>
            <Col sm={12}>
              <ItemTableDetail item={this.props.cartItem.item} />
            </Col>
          </Row>
        </td>
        <td data-th="Model No." className="text-center">
          <span>{this.state.item.model_no}</span>
        </td>
        <td data-th="Available" className="text-center">
          <span>{this.state.item.quantity}</span>
        </td>
        <td className="spacer" />
        <td className="text-center">
          <a href="" style={{color: "#5bc0de"}} onClick={this.deleteCartItem}>Delete</a>
        </td>
        <td />
        <td data-th="Quantity">
          <FormGroup bsSize="small" style={{margin:"auto"}}>
            <FormControl type="number" className="text-center" name="quantity" min={1} step={1} max={this.state.item.quantity} value={this.state.quantity} onChange={this.handleQuantityChange} />
          </FormGroup>
        </td>
        <td />
      </tr>
      )
    }
});

export default CartItemTableRow
