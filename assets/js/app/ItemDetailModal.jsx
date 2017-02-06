import React, { Component } from 'react'
import { Button, Modal}  from 'react-bootstrap'
import QuantityBox from './QuantityBox'
import SimpleRequest from './SimpleRequest'
import RequestList from './RequestList'
import $ from "jquery"
import Item from './Item'
import { getCookie } from '../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from './CreateTransactionsContainer'

class ItemDetailModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity:props.item.quantity,
    	showModal: false,
      requests: []
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.setQuantity = this.setQuantity.bind(this);
    this.updatePropQuantity = this.updatePropQuantity.bind(this);
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  updatePropQuantity(value){
    var thisObj = this
    console.log(value)
    this.setState({quantity:(thisObj.state.quantity + parseInt(value))});
  }

  setQuantity(value){
    console.log(value)
    this.setState({quantity:value});
  }

  addToCart(){
    if (!Number.isInteger(parseFloat(this.state.quantity)) || parseFloat(this.state.quantity)<=0){
      alert("Quantity must be a positive integer")
    }
    else{
      this.setState({showModal: false});
      var thisobj = this;
      $.ajax({
        url:"/api/cart/",
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        data: {
          item: thisobj.props.item.id,
          owner: thisobj.props.user.id,
          quantity: thisobj.state.quantity
        },
        success:function(response){},
        complete:function(){},
        error:function (xhr, textStatus, thrownError){
            alert("error doing something");
            console.log(xhr)
            console.log(textStatus)
            console.log(thrownError)
        }
      });
    }
  }

  render() {
    var requests=[];

    if(this.props.item.request_set.length == 0) {
      requests = "No outstanding requests."
    }

    else {
      var outstandingRequests = this.props.item.request_set.filter(function(request){
        return "O" == request.status;
      });
      requests = <RequestList simple requests={outstandingRequests} />
    }

    var createTransactionButton = "";
    if(this.props.user.is_staff) {
      createTransactionButton =
        <Modal.Body>
          <h4>Transactions</h4>
          <CreateTransactionsContainer itemIndex={this.props.itemIndex} updatePropQuantity = {this.props.handleChangeQuantity} item={this.props.item}/>
        </Modal.Body>
    }

    return (
      <div>

        <Item onClick={this.open} item={this.props.item}/>

        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.item.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Name: {this.props.item.name}</p>
            <p>Model No: {this.props.item.model}</p>
            <p>Description: {this.props.item.description}</p>
            <p>Quantity Available: {this.props.item.quantity}</p>
            <p>Location: {this.props.item.location}</p>
          </Modal.Body>
          <Modal.Body>
            <h4>Outstanding Requests</h4>
            {requests}
          </Modal.Body>
          {createTransactionButton}
          <Modal.Footer>
            <Button onClick={this.addToCart}>Add to Cart</Button>
            <QuantityBox onUserInput={this.setQuantity}/>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
export default ItemDetailModal
