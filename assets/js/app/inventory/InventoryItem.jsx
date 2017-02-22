import React from 'react'
import { Grid, Row, Col, Label, Button, Image, Panel, FormGroup, FormControl} from 'react-bootstrap'
import { browserHistory } from 'react-router'
import { ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

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

  ucFirst(str) {
    str = str.charAt(0).toUpperCase() + str.slice(1)
    str = str.replace("_", " ")
    return str
  },

  getCustomFieldView(field, i) {
    return (
      <div key={i}>
        <p><span>{this.ucFirst(field.name)}: </span><span>{this.ucFirst(field.value)}</span></p>
      </div>
    )
  },

  render() {
    return (
      <tr>
        <td data-th="Item Information">
          <Row>
            <Col sm={12}>
              <div style={{margin:"auto"}} className="clickable" onClick={() => browserHistory.push("/app/items/" + this.props.item.name + "/")}>
                <Row>
                  <Col sm={8}>
                    <h5>{this.props.item.name}</h5>
                    <p>{this.props.item.description}</p>
                  </Col>
                  <Col sm={4}>
                    {this.props.item.custom_fields.map( (field, i) => {
                      return field.field_type !== "m" ? this.getCustomFieldView(field, i) : null
                    })}
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
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
