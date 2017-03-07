import React from 'react'
import { Grid, Row, Col, Button, Panel, FormGroup, FormControl, Tooltip, OverlayTrigger} from 'react-bootstrap'
import { browserHistory } from 'react-router'
import ItemTableDetail from '../inventory/ItemTableDetail'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import { ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

require('react-datepicker/dist/react-datepicker.css');
require('react-datepicker/dist/react-datepicker-cssmodules.css');



const CartItemTableRow = React.createClass({

  getInitialState() {
    var startDate = (this.props.cartItem.due_date == null) ? moment().add(7, "day") : moment(this.props.cartItem.due_date)
    return {
      item: this.props.cartItem.item,
      quantity: this.props.cartItem.quantity,
      request_type: this.props.cartItem.request_type,
      due_date: startDate,
    }
  },

  handleTypeChange(e) {
    console.log(e.target.value)
    var reqType = e.target.value
    if (reqType == "disbursement") {
      this.setState({request_type: reqType}, this.updateCartItem)
    } else {
      var callback = null
      if (this.state.due_date != null) {
        callback = this.updateCartItem
      }
      this.setState({request_type: reqType}, callback)
    }
  },

  handleQuantityChange(e) {
    this.setState({quantity: Number(e.target.value)}, this.updateCartItem)
  },

  handleDateChange(date) {
    this.setState({due_date: date}, this.updateCartItem)
  },

  disableDatePicker() {
    return (this.state.request_type == 'disbursement')
  },

  updateCartItem() {
    var url = "/api/cart/" + this.state.item.name + "/"
    var _this = this
    var data = {}
    data['quantity'] = this.state.quantity
    data['request_type'] = this.state.request_type
    if (this.state.request_type == "loan") {
      data['due_date'] = this.state.due_date.toISOString()
    }
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
      <tr style={{height:"100px"}}>
        <td data-th="Item Information">
          <Row>
            <Col sm={12}>
              <ItemTableDetail item={this.props.cartItem.item} />
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <a href="" style={{color: "#5bc0de"}} onClick={this.deleteCartItem}>Delete</a>
            </Col>
          </Row>
        </td>
        <td data-th="Quantity">
          <FormGroup bsSize="small" style={{margin:"auto"}}>
            <FormControl type="number" className="text-center" name="quantity" value={this.state.quantity} onChange={this.handleQuantityChange} />
          </FormGroup>
        </td>
        <td />
        <td data-th="Request Type">
          <FormGroup bsSize="small" style={{margin:"auto"}}>
            <FormControl className="text-center" style={{fontSize:"10px"}} componentClass="select" name="request_type" value={this.state.request_type} onChange={this.handleTypeChange}>
              <option value="disbursement">Disbursement</option>
              <option value="loan">Loan</option>
            </FormControl>
          </FormGroup>
        </td>
        <td />
        <td data-th="Due Date" className="text-center">
          <DatePicker customInput={<ExampleCustomInput isDisabled={this.disableDatePicker} requestType={this.state.request_type}/>}
                      selected={this.state.due_date}
                      onChange={this.handleDateChange} />
        </td>
      </tr>
      )
    }
});

var ExampleCustomInput = React.createClass({
  propTypes: {
    isDisabled: React.PropTypes.func,
    onClick: React.PropTypes.func,
    value: React.PropTypes.string,
  },

  render () {
    return (
      <Button block disabled={this.props.isDisabled()} bsStyle="info" bsSize="small" onClick={this.props.onClick}>
        {this.props.value}
      </Button>
    )
  }
})

export default CartItemTableRow
