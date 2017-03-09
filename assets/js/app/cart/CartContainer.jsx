import React from 'react'
import { Grid, Row, Col, Table, FormGroup, FormControl, ControlLabel, Form } from 'react-bootstrap'
import CartItemTableRow from './CartItemTableRow'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'

const CartContainer = React.createClass({

  getInitialState() {
    return {
      cartItems: []
    }
  },

  componentWillMount() {
    this.getCartItems()
  },

  getCartItems() {
    var url = '/api/cart/'
    var _this = this
    getJSON(url, null, function(data) {
      _this.setState({
        cartItems: data,
      })
    })
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={10} xsOffset={1}>
            <Row>
              <Col xs={12}>
                <h3>Your Cart</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col xs={12}>
                <Table hover>
                  <thead>
                    <tr>
                      <th style={{width:"40%"}} className="text-left">Item Information</th>
                      <th style={{width:"5%" }} className="spacer"></th>
                      <th style={{width:"10%"}} className="text-center">Model No.</th>
                      <th style={{width:"10%"}} className="text-center">Available</th>
                      <th style={{width:"5%" }} className="spacer"></th>
                      <th style={{width:"10%"}} className="text-center"/>
                      <th style={{width:"8%"}} className="text-center">Quantity</th>
                      <th style={{width:"12%"}} className="text-center">Request Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.cartItems.map( (ci, i) => {
                      return (<CartItemTableRow key={ci.item.name} cartItem={ci} />)
                    })}
                  </tbody>
                </Table>
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>
    )
  }

})

export default CartContainer
