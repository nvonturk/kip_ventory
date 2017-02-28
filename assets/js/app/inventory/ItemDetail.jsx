import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, FormGroup, FormControl, ControlLabel}  from 'react-bootstrap'
import RequestList from '../RequestList'
import $ from "jquery"
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from './CreateTransactionsContainer'
import ItemModificationModal from './ItemModificationModal'
import _ from 'underscore'
import {browserHistory} from 'react-router'

class ItemDetail extends Component {
  constructor(props) {
    super(props);
    this.item_name = props.params.item_name;
    this.user = props.route.user;

    this.state = {
      requests: [],
      quantity:0,
      showModifyButton: props.route.user.is_staff,
      showModifyModal: false,
      //item: {}
    }
    this.addToCart = this.addToCart.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleTransactionCreated = this.handleTransactionCreated.bind(this);
    this.handleModifyClick = this.handleModifyClick.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.saveChanges = this.saveChanges.bind(this);

    this.getItem();
    //this.getRequests();
    //this.getTransactions();

  }

  getItem() {
    var url = '/api/items/' + this.item_name + '/';
    console.log("HERE")

    var thisobj = this;
    getJSON(url, function(data){
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
    getJSON(url, function(data) {
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

  handleModifyClick(event){
    event.preventDefault();
    this.setState({showModifyModal: true})
  }

  closeModal(){
    this.setState({showModifyModal: false});
  }

  addToCart(){
    // todo add these checks on the backend
    if ((!Number.isInteger(parseInt(this.state.quantity, 10))) || (this.state.quantity <= 0)){

      alert("Quantity must be a positive integer")
    }
    else if(this.state.item.quantity < this.state.quantity){
      alert("Quantity Exceeds Inventory Capacity")
    }
    else{
      var thisobj = this;
      ajax({
        url:"/api/items/" + thisobj.state.item.name + "/addtocart/",
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        data: {
          item: thisobj.state.item.id,
          owner: thisobj.user.id,
          quantity: thisobj.state.quantity
        },
        success:function(response){
          //reset form
          thisobj.setState({quantity:0})
        },
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


  deleteItem(){
    if(confirm("Are you sure you wish to continue?") == true){
      console.log("we got here")
      var thisobj = this
      $.ajax({
      url:"/api/items/" + thisobj.item_name + "/",
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var url = "/app/"
        browserHistory.push(url)
      },
      complete:function(){
          },
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");
      }
      });
    } else{

    }
  }

  saveChanges(name, quantity, model_no, description, tags){
    if(confirm("Are you sure you wish to continue?") == true){
      if ((!Number.isInteger(parseInt(quantity, 10))) || (quantity <= 0)){
        alert("Quantity must be a positive integer " + (this.state.quantity <= 0) )
      }
      var thisobj = this

      if( !Object.prototype.toString.call( tags ) === '[object Array]' ) {
        if(tags==""){
          var tagArray = [];
        } else{
          var tagArray = tags.split(",");
        }
      } else{
        var tagArray = tags;
      }

      $.ajax({
        url:"/api/items/" + thisobj.item_name + "/",
        type: "PUT",
        traditional: true,
        data: {quantity:quantity, name:name, model_no:model_no, description:description, tags:tagArray},
        statusCode: {
           400: function() {
             alert("Unsuitable Data");
           }
         },
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        success:function(response){
          var url = "/app/"
          browserHistory.push(url)
        },
        complete:function(){
            },
        error:function (xhr, textStatus, thrownError){
          console.log(xhr);
          console.log(textStatus);
          console.log(thrownError);
        }
      });

    } else{

    }
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value }, () => console.log(this.state.quantity));
  }


  // todo refactor this
  render() {

    // todo better logic for this
    if (!this.state.item || !this.state.requests) return <div>Item Does Not Exist</div>;

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

    var ModifyButton = React.createClass({
      render: function() {
        return (
          <div>
          <Button onClick={this.props.click} >Modify Item</Button>
          </div>
        );
      }
    });

    return (
      <Grid>
        <Row>
          <Col sm={12}>
            <h3>Item Details</h3>
            <hr />
          </Col>
        </Row>

        <Table hover>
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
        <FormGroup controlId="formQuantity">
          <ControlLabel>Quantity</ControlLabel>
            <FormControl
              type="number"
              name="quantity"
              value={this.state.quantity}
              onChange={this.handleChange}
            />
        </FormGroup>
        {
          this.state.showModifyButton
            ? <ModifyButton
              click={this.handleModifyClick}
              />
            : null
        }
        <ItemModificationModal showModal={this.state.showModifyModal} close={this.closeModal} item={this.state.item} deleteItem={this.deleteItem} saveChanges={this.saveChanges}/>
      </Grid>
    );
  }
}
export default ItemDetail
