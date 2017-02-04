import React, { Component } from 'react'
import { Button, Modal}  from 'react-bootstrap'
import QuantityBox from './quantitybox'
import SimpleRequest from './simplerequest'
import RequestList from './requestlist'
import $ from "jquery"
import Item from './item'
import { getCookie } from '../csrf/DjangoCSRFToken'

class ItemDetailModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity:0,
    	showModal: false,
      requests: []
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.setQuantity = this.setQuantity.bind(this);
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  setQuantity(value){
    this.setState({quantity:value});
  }

  addToCart(){
    this.setState({showModal: false});
    var thisobj = this
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



  render() {

    console.log(this.props.item.request_set);
    var requests=[];

    if(this.props.item.request_set.length == 0) {
      requests = "No outstanding requests."
    }

    //Todo: make sure it's only returning items for this user
    //if admin, get all requests
    //count doesn't matter, b/c there should never really be that many outstanding requests for a single item at one time
    else {
      var outstandingRequests = this.props.item.request_set.filter(function(request){
        return "O" == request.status;
      });
      requests = <RequestList simple requests={outstandingRequests} />
    }
    /*
    for (var i = 0; i < this.props.item.request_set.length; i++) {
      var request = this.props.item.request_set[i];
      console.log(request);
      if(request.status=='Outstanding') {
        var requestInfo= (
          <Modal.Header>
           <SimpleRequest request={request}/>
           </Modal.Header>
        )
        requests.push(requestInfo);
      }
      

    }
    */

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
            <p>User: {this.props.user.id}</p>
          </Modal.Body>
          <Modal.Body>
            <h3>Outstanding Requests</h3>
            {requests}
          </Modal.Body>
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
