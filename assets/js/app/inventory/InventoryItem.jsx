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
        <Label onClick={() => {browserHistory.push("/app/cart/")}} className="clickable" href="/app/cart/" bsStyle="warning">In Cart</Label>
      </div>
    ) : null
  },

  getPopover() {
    var content = null
    if (this.props.item.tags.length > 0) {
      content = this.props.item.tags.join(", ")
    } else {
      content = "This item has no tags."
    }
    return (
      <Popover style={{maxWidth:"200px"}} id="tag-popover" >
        <Col sm={12}>
          <div style={{fontSize:"10px"}}>
            <p>{content}</p>
          </div>
        </Col>
      </Popover>
    )
  },

  viewItemDetail(e) {
    browserHistory.push("/app/inventory/" + this.props.item.name + "/")
  },

  render() {
    return (
      <tr style={{height: "40px"}}>
        <td data-th="Item" className="clickable" onClick={this.viewItemDetail}>
          <h5 style={{color: "#df691a"}}>{this.props.item.name}</h5>
        </td>
        <td data-th="Model No." className="text-center">{this.props.item.model_no}</td>
        <td data-th="In Stock" className="text-center">{this.props.item.quantity}</td>
        <td data-th="Tags" className="text-center" style={{zIndex:"9999"}}>
          <OverlayTrigger rootClose trigger={["hover", "focus"]} placement="right" overlay={this.getPopover()}>
            <Glyphicon glyph="tags" className="clickable" onClick={(e) => this.setState({showTags: true})}/>
          </OverlayTrigger>
        </td>
        <td className="spacer" />
        <td data-th="Status" className="text-center">
          {this.getItemStatus(this.props.item)}
        </td>
        <td data-th="Quantity" style={{zIndex:"9999"}}>
          <FormGroup bsSize="small" style={{margin:"auto"}}>
            <FormControl style={{fontSize: "10px"}} type="number" min={1} step={1} max={this.props.item.quantity} value={this.state.quantity} className="form-control text-center" onChange={this.onChange} />
          </FormGroup>
        </td>
        <td className="spacer" />
        <td className="text-center" style={{zIndex:"9999"}}>
          <Button bsSize="small" bsStyle="info" onClick={this.addToCart}>Add to Cart</Button>
        </td>
      </tr>
    )
  }

})

export default InventoryItem
