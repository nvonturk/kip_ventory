import React from 'react'
import { Row, Col, Label, Button, FormGroup, FormControl, Checkbox, Glyphicon, OverlayTrigger, Popover, Badge } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import { ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

const InventoryItem = React.createClass({
  getInitialState() {
    return {
      quantity: 0,
      in_cart: this.props.item.in_cart,
      showTags: false
    }
  },

  onQuantityChange(event) {
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

  addToCart(e) {
    e.stopPropagation()
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
        _this.setState({
          quantity: response.quantity,
          in_cart: response.quantity
        });
      },
      complete:function() {
      },
      error:function (xhr, textStatus, thrownError){
          console.log(xhr);
          alert(xhr.responseText)
      }
    })
  },

  deleteCartItem(e) {
    e.stopPropagation()
    var url = "/api/cart/" + this.props.item.name + "/"
    var _this = this
    ajax({
      url: url,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          in_cart: 0
        })
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr)
      }
    });
  },

  getItemStatus(item) {
    return this.state.in_cart ? (
      <div style={{display: "flex", flexDirection: "row", justifyContent: 'space-around'}}>
        <Label style={{padding:"3px 5px"}} onClick={e => {e.stopPropagation(); browserHistory.push("/app/cart/")}} className="clickable" href="/app/cart/" bsStyle="warning">
          <span style={{verticalAlign: "middle"}}>
            In Cart &nbsp;
          </span>
          <Badge style={{fontSize: "10px"}}>{this.state.in_cart}</Badge>
        </Label>
      </div>
    ) : null
  },

  getRemoveFromCartLink() {
    return this.state.in_cart ? (
      <span className="clickable" style={{color: "#5bc0de", fontSize: "12px", textDecoration: "underline"}} onClick={this.deleteCartItem}>Remove</span>
    ) : null
  },

  getCartButton() {
    return this.state.in_cart ? (
      <Button disabled={this.state.quantity === 0} bsSize="small" bsStyle="info" style={{fontSize:"10px", width:"70px"}} onClick={this.addToCart}>
        <span>Update</span>
      </Button>
    ) : (
      <Button disabled={this.state.quantity === 0} bsSize="small" bsStyle="info" style={{fontSize:"10px", width:"70px"}} onClick={this.addToCart}>
        <span>Add to Cart</span>
      </Button>
    )
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
    var quantityInput = (this.props.minQuants) ? (
      null
    ) : (
      <td data-th="Quantity" style={{fontSize:"10px", zIndex:"9999"}} onClick={e => e.stopPropagation()}>
        <FormGroup bsSize="small" style={{margin:"auto", width:"70px"}}>
          <FormControl style={{fontSize: "10px"}} type="number" min={0} step={1} max={this.props.item.quantity} value={this.state.quantity} className="form-control text-center" onChange={this.onQuantityChange} />
        </FormGroup>
      </td>
    )

    var addToCartButton = (this.props.minQuants) ? (
      null
    ) : (
      <td className="text-center" style={{zIndex:"9999"}} onClick={e => e.stopPropagation()}>
        { this.getCartButton() }
      </td>
    )

    var minQuantsCheckbox  = (this.props.minQuants) ? (
      <td data-th="Select" style={{fontSize:"10px", zIndex:"9999"}}  onClick={e => e.stopPropagation()}>
        <Checkbox style={{textAlign: "center", margin: "0px"}} onChange={e => this.props.boxChange(e, this.props.item)} />
      </td>
    ) : (
      null
    )
    var nullPlaceHolder  = (this.props.minQuants) ? (
      <td style={{fontSize:"10px", zIndex:"9999"}} onClick={e => e.stopPropagation()}>
      </td>
    ) : (
      null
    )

    var minStock = (this.props.minQuants) ? (
      <td data-th="Min Stock" style={{fontSize:"10px"}} className="text-center">{this.props.item.minimum_stock}</td>
    ) : null

    return (
      <tr className="clickable" onClick={this.viewItemDetail}>
        <td data-th="Item">
          <h6 style={{color: "#df691a"}}>{this.props.item.name}</h6>
        </td>
        <td data-th="Model No." style={{fontSize:"10px"}} className="text-center">{this.props.item.model_no}</td>
        <td data-th="In Stock" style={{fontSize:"10px"}} className="text-center">{this.props.item.quantity}</td>
        <td data-th="Tags" className="text-center" style={{fontSize:"10px", zIndex:"9999"}}>
          <OverlayTrigger rootClose trigger={["hover", "focus"]} placement="right" overlay={this.getPopover()}>
            <Glyphicon glyph="tags" className="clickable" onClick={(e) => this.setState({showTags: true})}/>
          </OverlayTrigger>
        </td>
        <td className="text-center" style={{zIndex: "9999"}}>
          { this.getRemoveFromCartLink() }
        </td>
        <td data-th="Status" className="text-center" style={{zIndex: "9999"}}>
          { this.getItemStatus(this.props.item) }
        </td>
        { minStock }
        <td className="spacer" />
        {quantityInput}
        {addToCartButton}
        {minQuantsCheckbox}
      </tr>
    )
  }

})

export default InventoryItem
