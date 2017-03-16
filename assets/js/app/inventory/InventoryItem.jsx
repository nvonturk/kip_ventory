import React from 'react'
import { Row, Col, Label, Button, FormGroup, FormControl, Glyphicon, OverlayTrigger, Popover } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import { ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import ItemTableDetail from './ItemTableDetail'


const InventoryItem = React.createClass({
  getInitialState() {
    return {
      quantity: 1,
      in_cart: this.props.item.in_cart,
      showTags: false
    }
  },

  onChange(event) {
    event.preventDefault()
    var q = Number(event.target.value)
    if (q > this.props.item.quantity) {
      event.stopPropagation()
    } else {
      this.setState({
        quantity: q
      })
    }
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
        <Label className="clickable" href="/app/cart/" bsStyle="warning">In Cart</Label>
      </div>
    ) : null
  },

  getPopover() {
    return (
      <Popover style={{maxWidth:"200px"}} id="tag-popover" >
        <Col sm={12}>
          <div style={{fontSize:"10px"}}>
            <p>{this.props.item.tags.join(', ')}</p>
          </div>
        </Col>
      </Popover>
    )
  },

  render() {
    return (
      <tr>
        <td data-th="Item Information">
          <ItemTableDetail item={this.props.item} />
        </td>
        <td data-th="Model No." className="text-center">{this.props.item.model_no}</td>
        <td data-th="Available" className="text-center">{this.props.item.quantity}</td>
        <td data-th="Tags" className="text-left">
          <OverlayTrigger rootClose trigger="click" placement="right" overlay={this.getPopover()}>
            <Glyphicon glyph="tags" className="clickable" onClick={(e) => this.setState({showTags: true})}/>
          </OverlayTrigger>
        </td>
        <td className="text-center">
          {this.getItemStatus(this.props.item)}
        </td>
        <td data-th="Quantity">
          <FormGroup bsSize="small" style={{margin:"auto"}}>
            <FormControl type="number" min={1} step={1} max={this.props.item.quantity} value={this.state.quantity} className="form-control text-center" onChange={this.onChange} />
          </FormGroup>
        </td>
        <td className="text-center" >
          <Button bsSize="small" bsStyle="info" onClick={this.addToCart}>Add to Cart</Button>
        </td>
      </tr>
    )
  }

})

export default InventoryItem
