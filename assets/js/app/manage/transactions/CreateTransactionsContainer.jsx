import React, { Component } from 'react'
import { ajax } from "jquery"
import { Form, Row, Col, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Button, Glyphicon} from 'react-bootstrap'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import $ from 'jquery'

class CreateTransactionsContainer extends Component {
  constructor(props) {
    super(props);
     this.state = {
      showModal: false,
      category: "Acquisition",
      quantity: 1,
      comment: "",
      items: [],
      item_name: "",
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.handleQuantityChange = this.handleQuantityChange.bind(this);
    this.handleCommentChange = this.handleCommentChange.bind(this);
    this.handleTypeChange = this.handleTypeChange.bind(this);
    this.createTransaction = this.createTransaction.bind(this);
    this.getItems = this.getItems.bind(this)
    this.handleItemChange = this.handleItemChange.bind(this);

    this.getItems()

  }

  getItems(){
    var thisObj = this;
    var params = {
      all: true
    };
    $.getJSON("/api/items.json", params, function(data){
      var item_name = data.results.length > 0 ? data.results[0].name : "";
      thisObj.setState({items: data.results, item_name: item_name})
    });
  }

  getItemOptions() {
    return this.state.items.map((item, i)=> { return <option key={item.name} value={item.name}>{item.name}</option>})

  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  handleItemChange(item) {
    this.setState({item_name: item.target.value});
  }

  handleQuantityChange(e) {
    var q = Number(e.target.value)
    if (q > 0) {
      this.setState({quantity: e.target.value})
    }
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
      item: this.state.item_name
    }

    var thisObj = this;
    ajax({
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
        thisObj.props.handleTransactionCreated();
      },
      complete:function() {
      },
      error:function (xhr, textStatus, thrownError){
          alert(xhr.responseText);
      }
    });
  }

  render() {

    return (
      <div>
          <Button bsSize="small" bsStyle="primary" style={{verticalAlign:"middle", fontSize:"10px"}} onClick={this.open}>
              Log an Acquisition or Loss &nbsp; <Glyphicon glyph="plus" />
          </Button>
         <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>Log an Acquisition or Loss of Instances</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Form horizontal onSubmit={e => {e.preventDefault(); e.stopPropagation();}}>
              <FormGroup bsSize="small" controlId="formControlsSelect">
                <Col xs={2} componentClass={ControlLabel}>
                  Item
                </Col>
                <Col xs={10}>
                  <FormControl componentClass="select" value={this.state.item_name} onChange={this.handleItemChange}>
                    {this.getItemOptions()}
                  </FormControl>
                </Col>
              </FormGroup>

              <FormGroup bsSize="small" controlId="formControlsText">
                <Col xs={2} componentClass={ControlLabel}>
                  Quantity
                </Col>
                <Col xs={2}>
                  <FormControl type="number" min={1} step={1} value={this.state.quantity} onChange={this.handleQuantityChange} />
                </Col>
                <Col xs={2} componentClass={ControlLabel}>
                  Category
                </Col>
                <Col xs={4}>
                  <FormControl componentClass="select" placeholder="select" value={this.state.category} onChange={this.handleTypeChange}>
                    <option value="Acquisition">Acquisition</option>
                    <option value="Loss">Loss</option>
                  </FormControl>
                </Col>
              </FormGroup>

               <FormGroup bsSize="small" controlId="formControlsText">
                 <Col xs={2} componentClass={ControlLabel}>
                   Comment
                 </Col>
                 <Col xs={10}>
                 <FormControl type="text"
                              style={{resize: "vertical", height:"100px"}}
                              componentClass={"textarea"}
                              name="comment"
                              value={this.state.comment}
                              onChange={this.handleCommentChange}/>
                 </Col>
              </FormGroup>

            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" bsStyle="default" onClick={this.close}>Close</Button>
            <Button bsSize="small" bsStyle="info" onClick={this.createTransaction}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}


export default CreateTransactionsContainer
