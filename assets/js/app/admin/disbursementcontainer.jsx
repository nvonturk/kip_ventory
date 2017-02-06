import React, {Component} from 'react'
import { Row, Col, Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap'
import $ from 'jquery'
import SimpleDropdown from '../simpledropdown'
import { getCookie } from '../../csrf/DjangoCSRFToken'

class DisbursementContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      items: [],
      quantity: 0,
      comment: "",
      userlist: [],
      itemlist: [],
      currentuser: null,
      currentitem: null

    }
    this.handleChange = this.handleChange.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.disburse = this.disburse.bind(this);
    this.createUserlist = this.createUserlist.bind(this);
    this.createItemlist = this.createItemlist.bind(this);
    this.changeItem = this.changeItem.bind(this);
    this.changeUser = this.changeUser.bind(this);

    this.getUsers()
    this.getItems()
  }

  getUsers(){
    var thisObj = this
    $.getJSON("/api/users.json", function(data){
      thisObj.setState({users: data})
      thisObj.createUserlist(data)
    });
  }

  getItems() {
  	var thisObj = this;
  	$.getJSON("/api/items.json", function(data) {
      thisObj.setState({items: data})
  		thisObj.createItemlist(data);
  	});
  }

  createUserlist(data){
    var list = []
    for (var i = 0; i < data.length; i++){
      list.push({name: data[i].username})
    }
    this.setState({userlist: list})
  }

  createItemlist(data){
    var list = []
    for (var i = 0; i < data.length; i++){
      list.push({name: data[i].name})
    }
    this.setState({itemlist: list})
  }

  handleChange(event) {
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  }

  changeUser(event){
    console.log(event)
    this.setState({currentuser: event})
  }

  changeItem(event){
    console.log(event)
    this.setState({currentitem: event})
  }

  disburse(){
    // Need to delete quantity here
    var thisObj = this
    console.log("INFOSTART")
    console.log(Number.isInteger(parseFloat(this.state.quantity)))
    console.log("INFOEND")
    if(this.state.currentitem == null || !this.state.currentuser == null || this.state.comment == ""){
      alert("Must use all fields to disburse")
    }
    else if(this.state.items[this.state.currentitem].quantity < this.state.quantity){
      alert("Quantity Exceeds Capacity. Current quantity for " + this.state.items[this.state.currentitem].name + " is: " + this.state.items[this.state.currentitem].quantity)
    }
    else if(!Number.isInteger(parseFloat(this.state.quantity)) || parseFloat(this.state.quantity)<=0){
      alert("Quantity must be positive integer")
    }
    else{
      var d = new Date();
      var n = d.toISOString();
      $.ajax({
      url:"/api/requests/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        // Need to add rest of info
        item: thisObj.state.items[this.state.currentitem].id,
        requester: thisObj.state.users[this.state.currentuser].id,
        quantity: thisObj.state.quantity,
        closed_comment: thisObj.state.comment,
        date_open: n,
      },
      success:function(response){},
      complete:function(){
        // Need to subtract quantity
        thisObj.setState({
          quantity: 0,
          comment: "",
          currentuser: -1,
          currentitem: -1
        })
      },
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

    return (
      <div>
        <Row>
          <SimpleDropdown title="Select User" items={this.state.userlist} callback={this.changeUser} />
          <SimpleDropdown title="Select Item" items={this.state.itemlist} callback={this.changeItem}/>
        </Row>
        <Row>
          <Col xs={2} md={2}>
          <FormGroup controlId="quantityForm">
            <ControlLabel>Selected Quantity</ControlLabel>
            <FormControl
              type="number"
              name="quantity"
              value={this.state.quantity}
              placeholder={this.state.quantity}
              onChange={this.handleChange}
            />
          </FormGroup>
          </Col>
          <Col xs = {8} md = {8}>
          <FormGroup controlId="commentForm">
            <ControlLabel>Comment</ControlLabel>
            <FormControl
              type="text"
              name="comment"
              value={this.state.comment}
              placeholder={this.state.comment}
              onChange={this.handleChange}
            />
          </FormGroup>
          </Col>
        </Row>
        <Row>
          <Button onClick={this.disburse}>Disburse</Button>
        </Row>
      </div>

    )
  }
}

export default DisbursementContainer
