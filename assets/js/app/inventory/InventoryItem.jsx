import React from 'react'
import { Grid, Row, Col, Label, Button, Image, Panel, FormGroup, FormControl} from 'react-bootstrap'
import { browserHistory } from 'react-router'
import { ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import ItemTableDetail from './ItemTableDetail'

const InventoryItem = React.createClass({
  getInitialState() {
    return {
      quantity: 1,
      in_cart: this.props.item.in_cart
    }
  },

  onChange(event) {
    event.preventDefault()
    this.setState({
      quantity: Number(event.target.value)
    })
  },

  addToCart() {
    var url = "/api/items/" + this.props.item.name + "/addtocart/";
    var data = {
      quantity: this.state.quantity,
    }

    var _this = this;
    ajax({
      type: "POST",
      url: url,
      data: data,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        // console.log(response)
        _this.setState({
          quantity: response.quantity,
          in_cart: true
        });
      },
      complete:function() {
      },
      error:function (xhr, textStatus, thrownError){
          alert(xhr.responseText);
      }
    })
  },

  getItemStatus(item) {
    return this.state.in_cart ? (
      <div style={{display: "flex", flexDirection: "row", justifyContent: 'space-around'}}>
        <Label className="clickable" onClick={() => browserHistory.push("/app/cart/")} bsStyle="warning">In Cart</Label>
      </div>
    ) : null
  },


  render() {
    return (
      <tr>
        <td data-th="Item Information">
          <ItemTableDetail item={this.props.item} />
        </td>
        <td data-th="Available" className="text-center">{this.props.item.quantity}</td>
        <td data-th="Status" className="text-center">
          {this.getItemStatus(this.props.item)}
        </td>
        <td data-th="Quantity">
          <FormGroup bsSize="small" style={{margin:"auto"}}>
            <FormControl type="number" className="form-control text-center" defaultValue={1} onChange={this.onChange} />
          </FormGroup>
        </td>
        <td className="text-center" data-th="Action">
          <Button bsSize="small" bsStyle="info" onClick={this.addToCart}>Add to Cart</Button>
        </td>
      </tr>
    )
  }

})

export default InventoryItem
