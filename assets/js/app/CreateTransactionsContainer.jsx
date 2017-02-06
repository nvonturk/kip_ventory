import React, { Component } from 'react'
import $ from "jquery"
import { FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Button} from 'react-bootstrap'
import { getCookie } from '../csrf/DjangoCSRFToken'


class CreateTransactionsContainer extends Component {
  constructor(props) {
    super(props);
     this.state = {
      showModal: false,
      category: "Acquisition",
      quantity: 0,
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handleCommentChange = this.handleCommentChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.createTransaction = this.createTransaction.bind(this);

  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  handleQuantityChange(e) {
    this.setState({quantity: e.target.value})
  }

  handleCommentChange(e) {
    this.comment = e.target.value;
  }

  handleTypeChange(e) {
    this.setState({category: e.target.value})
  }

  createTransaction() {
    console.log(parseInt(this.props.item.quantity) - parseInt(this.state.quantity) < 0)
    if (!Number.isInteger(parseInt(this.state.quantity)) || parseInt(this.state.quantity)<=0){
      alert("Must be a positive integer")
    }
    else if(parseInt(this.props.item.quantity) - parseInt(this.state.quantity) < 0 && this.state.category == "Loss"){
      alert("Attempting to remove more items from the inventory than currently exists")
    }
    else {

    var data={
      quantity: this.state.quantity,
      comment: this.comment,
      category: this.state.category,
      item: this.props.item.id
    }

    var thisObj = this;
    $.ajax({
      type: "POST",
      url:"/api/transactions/",
      data: data,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        console.log(response);
        thisObj.props.updatePropQuantity(thisObj.props.itemIndex, thisObj.state.category == "Acquisition" ? thisObj.state.quantity : -(thisObj.state.quantity));
        thisObj.setState({
          showModal: false,
          category: "Acquisition",
          quantity: 0
        });
      },
      complete:function() {
        //thisObj.props.handleTransactionCreated(); need something like this to update item quantity/transactions immediately
      },
      error:function (xhr, textStatus, thrownError){
          alert("error creating transaction");
          console.log(xhr)
          console.log(textStatus)
          console.log(thrownError)
      }
    });
  }
  }

  render() {
    /*
      item
      quantity
      category (acquisition, loss)
      comment
      date - automatic
      administrator - automatic

       <FieldGroup
                id="formControlsText"
                type="text"
                label="Quantity"
                placeholder="Enter amount acquired or lost."
                help="Must be a number"
                onChange={this.handleQuantityChange}
              />
              <FieldGroup
                id="formControlsText"
                type="text"
                label="Comment"
                placeholder="Enter an explanation."
                onChange={this.handleCommentChange}
              />
      */

    return (
      <div>
         <Button bsStyle="success" onClick={this.open}>Create Transaction</Button>

         <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Create Transaction</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form>
              <FormGroup controlId="formControlsText">
                <ControlLabel>Quantity</ControlLabel>
                <FormControl type="text" placeholder="Enter amount acquired or lost." onChange={this.handleQuantityChange} />
                <HelpBlock>Must be a number</HelpBlock>
              </FormGroup>

              <FormGroup controlId="formControlsSelect">
                <ControlLabel>Type</ControlLabel>
                <FormControl componentClass="select" placeholder="select" onChange={this.handleTypeChange}>
                  <option value="Acquisition">Acquisition</option>
                  <option value="Loss">Loss</option>
                </FormControl>
              </FormGroup>

               <FormGroup controlId="formControlsText">
                <ControlLabel>Comment</ControlLabel>
                <FormControl type="text" placeholder="Enter an explanation." onChange={this.handleCommentChange} />
              </FormGroup>

            </form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.createTransaction}>Create</Button>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}


export default CreateTransactionsContainer
