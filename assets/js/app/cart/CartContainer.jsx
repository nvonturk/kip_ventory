import React, { Component } from 'react'
import { Grid, Row, Col, Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'
import CartItem from './CartItem'
import $ from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'


class CartContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      comment: "",
    };

    this.getCartItems = this.getCartItems.bind(this);
    this.reRender = this.reRender.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
    this.makeRequests = this.makeRequests.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillMount() {
    this.getCartItems()
  }

  makeRequests(){
    if(this.state.comment == ""){
      alert("Justification needed for request")
    }
    else{
      for (var i = 0; i < length(this.state.items); i++){
        this.makeRequest(this.state.items[i])
      }
    }
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  makeRequest(){
    // CHeck to make sure the quantity is possible
    var thisobj = this

    $.ajax({
    url:"/api/requests/",
    type: "POST",
    data: {open_comment: this.state.comment},
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    },
    success:function(response){thisobj.getCartItems()},
    complete:function(){},
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");
    }
    });

  }

  reRender(item_name) {
    var thisobj = this
    $.ajax({
    url:"/api/cart/" + item_name,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    },
    success:function(response){thisobj.getCartItems();},
    complete:function(){
        },
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");

    }
    });

  }

  getCartItems() {
    var thisobj = this
    $.getJSON("/api/cart/", function(data) {
      thisobj.setState({items: data,})
    });
  }

  render() {
    var items = this.state.items
    return (
      <Grid>
        <Row>
          <Col xs={12}>
          {this.state.items.map(function(cartItem, i) {
            return (
              <Row key={cartItem.item.name}>
                <CartItem reRender={this.reRender} cartItem={cartItem}/>
              </Row>
            )}.bind(this))}
          </Col>
        </Row>
        <Row>
          <Col xs={6} md={6}>
            <FormGroup controlId="formOpenComment">
              <ControlLabel>Comment</ControlLabel>
                <FormControl
                  type = "text"
                  name="comment"
                  value={this.state.comment}
                  placeholder={this.state.comment}
                  onChange={this.handleChange}
                />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Button bsStyle="primary" onClick={() => this.makeRequest()} className="requestButton">Make Request</Button>
        </Row>
      </Grid>
    )
  }

}

export default CartContainer
