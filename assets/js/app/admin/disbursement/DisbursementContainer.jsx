import React, {Component} from 'react'
import { Grid, Row, Col, Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap'
import $ from 'jquery'
import SimpleDropdown from '../../SimpleDropdown'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

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
    var thisObj = this;
    $.getJSON("/api/users/", function(data){
      thisObj.setState({users: data})
      thisObj.createUserlist(data)
    });
  }

  getItems() {
  	var thisObj = this;
  	$.getJSON("/api/items/", function(data) {
      data = data.results
      thisObj.setState({items: data});
  		thisObj.createItemlist(data);
  	});
  }

  createUserlist(data){
    var list = []
    for (var i = 0; i < data.length; i++){
      list.push({value: data[i].username, label: data[i].username})
    }
    this.setState({userlist: list})
  }

  createItemlist(data){
    var list = []
    for (var i = 0; i < data.length; i++){
      list.push({value: data[i].name, label: data[i].name})
    }
    this.setState({itemlist: list})
  }

  handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  changeUser(event){
    this.setState({currentuser: event})
  }

  changeItem(event){
    this.setState({currentitem: event})
  }

  disburse(){
    // Need to delete quantity here
    var thisObj = this
    if(this.state.currentitem == null || !this.state.currentuser == null || this.state.comment == ""){
      alert("Must use all fields to disburse")
    }
    else if(thisObj.state.items.filter(item => item.name === thisObj.state.currentitem)[0].quantity < this.state.quantity){
      alert("Quantity Exceeds Capacity. Current quantity for " + thisObj.state.items.filter(item => item.name === thisObj.state.currentitem)[0].name + " is: " + thisObj.state.items.filter(item => item.name === thisObj.state.currentitem)[0].quantity)
    }
    else if(!Number.isInteger(parseFloat(this.state.quantity)) || parseFloat(this.state.quantity)<=0){
      alert("Quantity must be positive integer")
    }
    else{
      $.ajax({
      url:"/api/disburse/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        // Need to add rest of info in backend
        item: thisObj.state.items.filter(item => item.name === thisObj.state.currentitem)[0].id,
        requester: thisObj.state.users.filter(user => user.username === thisObj.state.currentuser)[0].id,
        quantity: thisObj.state.quantity,
        closed_comment: thisObj.state.comment
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

      }
  });

  }

  }

  render() {
    return (
      <Grid fluid>
        <Row>
          <Select ref="userSelect" autofocus options={this.state.userlist} simpleValue clearable={true} placeholder="Select User" name="selected-user" value={this.state.currentuser} onChange={this.changeUser} searchable={true}/>
          <Select ref="itemSelect" autofocus options={this.state.itemlist} simpleValue clearable={true} placeholder="Select Item"  name="selected-item" value={this.state.currentitem} onChange={this.changeItem} searchable={true}/>
        </Row>
        <Row>
          <Col xs={2} md={2}>
          <FormGroup controlId="quantityForm">
            <ControlLabel>Quantity</ControlLabel>
            <FormControl
              type="number"
              name="quantity"
              value={this.state.quantity}
              placeholder={this.state.quantity}
              onChange={this.handleChange}
            />
          </FormGroup>
          </Col>
          <Col xs = {10} md = {10}>
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
      </Grid>

    )
  }
}

export default DisbursementContainer
