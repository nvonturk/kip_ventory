import React, { Component } from 'react'
import $ from "jquery"
import { FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Button} from 'react-bootstrap'
import { getCookie } from '../csrf/DjangoCSRFToken'


class CreateTransactionsContainer extends Component {
  constructor(props) {
    super(props);
     this.state = {
      showModal: false,
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handleCommentChange = this.handleCommentChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.createTransaction = this.createTransaction.bind(this);

    this.category = "Acquisition";
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  handleQuantityChange(e) {
    this.quantity = e.target.value;
  }

  handleCommentChange(e) {
    this.comment = e.target.value;
  }

  handleTypeChange(e) {
    this.category = e.target.value;
  }

  createTransaction() {
    console.log(this.quantity);
    console.log(this.comment);
    console.log(this.category);
    var data={
      quantity: this.quantity,
      comment: this.comment,
      category: this.category,
      item: this.props.item_id
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
      },
      complete:function() {
        thisObj.setState({
          showModal: false,
        });
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
         <Button onClick={this.open}>Create Transaction</Button>

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
