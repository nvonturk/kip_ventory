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
      quantity: "",
      comment: ""
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
    this.setState({comment: e.target.value})
  }

  handleTypeChange(e) {
    this.setState({category: e.target.value})
  }

  createTransaction() {
    if (!Number.isInteger(parseInt(this.state.quantity)) || parseInt(this.state.quantity)<=0){
      alert("Quantity Must be a positive integer")
      return;
    }

    var data = {
      quantity: this.state.quantity,
      comment: this.state.comment,
      category: this.state.category,
      item: this.props.item.name
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
        thisObj.setState({
          showModal: false,
          category: "Acquisition",
          quantity: "", 
          comment: ""
        });
      },
      complete:function() {
        //todo success vs complete
        thisObj.props.handleTransactionCreated(); 
      },
      error:function (xhr, textStatus, thrownError){
          alert(xhr.responseText);
      }
    });
  }

  render() {

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
                <FormControl type="text" placeholder="Enter amount acquired or lost." value={this.state.quantity} onChange={this.handleQuantityChange} />
                <HelpBlock>Must be a positive integer</HelpBlock>
              </FormGroup>

              <FormGroup controlId="formControlsSelect">
                <ControlLabel>Type</ControlLabel>
                <FormControl componentClass="select" placeholder="select" value={this.state.category} onChange={this.handleTypeChange}>
                  <option value="Acquisition">Acquisition</option>
                  <option value="Loss">Loss</option>
                </FormControl>
              </FormGroup>

               <FormGroup controlId="formControlsText">
                <ControlLabel>Comment</ControlLabel>
                <FormControl type="text" placeholder="Enter an explanation." value={this.state.comment} onChange={this.handleCommentChange} />
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
