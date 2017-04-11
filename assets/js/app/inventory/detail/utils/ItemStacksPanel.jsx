import React from 'react'
import {Panel, Table, Row, Col, Form, ControlLabel, FormGroup, FormControl, Button} from 'react-bootstrap'
import {ajax} from 'jquery'
import { getCookie } from '../../../../csrf/DjangoCSRFToken'

const ItemStacksPanel = React.createClass({

  getInitialState() {
    return {
      addToCartQuantity: 0,
    }
  },

  handleCartQuantityChange(e) {
    var q = Number(e.target.value)
    if (q > this.props.item.quantity) {
      event.stopPropagation()
    } else {
      this.setState({
        addToCartQuantity: q
      })
    }
  },

  addToCart(e) {
    e.stopPropagation()
    e.preventDefault()
    var url = "/api/items/" + this.props.item.name + "/addtocart/"
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify({
        quantity: _this.state.addToCartQuantity
      }),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var new_url = "/app/inventory/" + _this.props.item.name + "/"
        window.location.assign(new_url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  getAddToCartForm() {
    return (
          <Row>
            <Col xs={12}>
              <Form horizontal onSubmit={this.addToCart} style={{marginBottom: "0px"}}>
                <FormGroup bsSize="small">
                  <Col xs={3} style={{textAlign:"center"}} componentClass={ControlLabel}>
                    Qty:
                  </Col>
                  <Col xs={4}>
                    <FormControl type="number"
                                 min={0} max={this.props.item.quantity} step={1}
                                 name="addToCartQuantity"
                                 value={this.state.addToCartQuantity}
                                 onChange={this.handleCartQuantityChange} />
                  </Col>
                  <Col xs={5}>
                    <Button disabled={this.state.addToCartQuantity == 0} bsStyle="info" bsSize="small" type="submit">Add to cart</Button>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>
    )
  },

  getItemStacksPanel() {
    return (
      <Panel header={"Item Tracking"}>
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>
            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>In Stock</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.props.stacks.in_stock}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Requested</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.props.stacks.requested}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Loaned</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.props.stacks.loaned}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Disbursed</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.props.stacks.disbursed}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>In Cart</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.props.stacks.in_cart}</td>
            </tr>
          </tbody>
        </Table>

        <hr />

        { this.getAddToCartForm() }

      </Panel>
    )
  },

  render() {
    return this.getItemStacksPanel()
  }
})

export default ItemStacksPanel
