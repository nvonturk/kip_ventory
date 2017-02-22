import React, { Component } from 'react'
import { Button, Modal, Table}  from 'react-bootstrap'
import QuantityBox from './QuantityBox'
import SimpleRequest from './SimpleRequest'
import RequestList from './RequestList'
import $ from "jquery"
import Item from './Item'
import { getCookie } from '../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from './CreateTransactionsContainer'
import _ from 'underscore'

class ItemDetailModal extends Component {
  constructor(props) {
    super(props);
    this.item_name = this.props.params.item_name;
    this.user = this.props.route.user;
  
    this.state = {
      requests: [],
      cart_quantity:"",
      //item: {}
    }
    this.addToCart = this.addToCart.bind(this);
    this.setCartQuantity = this.setCartQuantity.bind(this);
    this.handleTransactionCreated = this.handleTransactionCreated.bind(this);

    this.getItem();
    //this.getRequests();
    //this.getTransactions();
  }

  getItem() {
    var url = '/api/items/' + this.item_name + '/';
    console.log("get item" + url);

    var thisobj = this;
    $.getJSON(url, function(data){
      thisobj.setState({
        item: data,
      });
    });
  }

  // todo update this code now that we switched away from ItemDetailModal
  getRequests() {
    // Get outstanding requests and re-render if they are different than local state
    // Another thing I noticed: all item detail modals get renderd on page load, just with showModal = false. Could be performance issue later on
    var url = "/api/items/" + this.item_name + "/requests/";
    var thisObj = this;
    $.getJSON(url, function(data) {
      var outstandingRequests = data.filter(function(request) {
        return request.status == "O";
      });

      var shouldUpdateRequests = !_.isEqual(outstandingRequests, thisObj.state.requests);
      if(shouldUpdateRequests) {
        thisObj.setState({
          requests: outstandingRequests
        });
      }
    });
  }

  // todo display a log of transactions in this detail view
  getTransactions() {

  }

  setCartQuantity(value) {
    this.setState({
      cart_quantity:value
    })
  }

  addToCart(){
    // todo add these checks on the backend
    if (!Number.isInteger(parseFloat(this.state.cart_quantity)) || parseFloat(this.state.cart_quantity)<=0){
      alert("Quantity must be a positive integer")
    }
    else if(this.state.item.quantity < this.state.cart_quantity){
      alert("Quantity Exceeds Inventory Capacity")
    }
    else{
      var thisobj = this;
      $.ajax({
        url:"/api/cart/",
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        data: {
          item: thisobj.state.item.id,
          owner: thisobj.user.id,
          quantity: thisobj.state.cart_quantity
        },
        success:function(response){},
        complete:function(){},
        error:function (xhr, textStatus, thrownError){
            alert("error adding item to cart");
        }
      });
    }
  }

  // Item quantity has changed, so update it
  handleTransactionCreated() {
    this.getItem();
  }

  getTableRow(item, i) {
    var tags = "";
    for(var i = 0; i < item.tags.length; i++) {
      var tag = item.tags[i];
      tags += " " + tag;
    }
    return (
      <tr key={item.name}>
        <td>{item.name}</td>
        <td>{item.model_no}</td>
        <td>{item.description}</td>
        <td>{item.quantity}</td>
        <td>{item.location}</td>
        <td>{tags}</td>
      </tr>
    )
  }

  // todo: custom fields
  getTableHeader() {
    return (
      <thead>
        <tr>
          <th>Item Name</th>
          <th>Model No</th>
          <th>Description</th>
          <th>Quantity Available</th>
          <th>Location</th>
          <th>Tags</th>
        </tr>
      </thead>
    )
  }

  // todo refactor this 
  render() {

    // todo better logic for this
    if (!this.state.item || !this.state.requests) return null;    

    var requestListView=[];

    if(this.state.requests.length == 0) {
      requestListView = "No outstanding requests."
    }

    else {
      requestListView = <RequestList simple requests={this.state.requests} />
    }

    var createTransactionView = "";
    if(this.user.is_staff) {
      createTransactionView =
        <div>
          <h4>Transactions</h4>
          <CreateTransactionsContainer item={this.state.item} handleTransactionCreated={this.handleTransactionCreated}/>
        </div>
    }

    return (
      <div>
        <h4>Item Details</h4>
        <Table striped bordered condensed hover>
          {this.getTableHeader()}
          <tbody>
            {this.getTableRow(this.state.item, 0)}
          </tbody>
        </Table>
        <h4>Outstanding Requests</h4>
        {/*
        <Table striped bordered condensed hover>
          {getRequestTableHeader()}
          <tbody>
            {this.getRequestTableRow(request, i))}
          </tbody>
        </Table>
        */}
        {requestListView}
        {createTransactionView}
        <h4> Cart </h4>
        <Button onClick={this.addToCart}>Add to Cart</Button>
        <QuantityBox onUserInput={this.setCartQuantity}/>
      </div>
    );   
  }
}
export default ItemDetailModal
