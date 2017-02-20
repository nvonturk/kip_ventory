import React, { Component } from 'react'
import { Table, Button } from 'react-bootstrap'
import $ from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class NewUserRequestsContainer extends Component {
  constructor(props) {
    super(props); 
    this.state = {
      newUserRequests:[],
    };
    this.denyNewUserRequest = this.denyNewUserRequest.bind(this);
    this.approveNewUserRequest = this.approveNewUserRequest.bind(this);
    this.getTableRow = this.getTableRow.bind(this);

    this.getNewUserRequests();
  }

  getNewUserRequests(){
    var thisobj = this;
    $.getJSON("/api/newuserrequests/", function(data){
      thisobj.setState({
        newUserRequests: data
      });
    });
  }

  approveNewUserRequest(request) {
    console.log("Approve request" + request.username);
    
    var thisobj = this;
    $.ajax({
      url:"/api/newuserrequests/" + request.username + "/approve",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        thisobj.getNewUserRequests();
      },
      error:function (xhr, textStatus, thrownError){
          alert("error approving request")
      }
    });

  }

  denyNewUserRequest(request) {
        console.log("Deny request" + request.username);

    var thisobj = this;
    $.ajax({
      url:"/api/newuserrequests/" + request.username + "/deny",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        thisobj.getNewUserRequests();
      },
      error:function (xhr, textStatus, thrownError){
          alert("error denying request")
      }
    });

  }

  getTableRow(request, i) {
    return (
    <tr key={request.username}>
      <td>{i+1}</td>
      <td>{request.first_name}</td>
      <td>{request.last_name}</td>
      <td>{request.username}</td>
      <td>{request.email}</td>
      <td><Button bsStyle="success" onClick={() => this.approveNewUserRequest(request)}>Approve</Button><Button bsStyle="danger" onClick={() => this.denyNewUserRequest(request)}>Deny</Button></td>
    </tr>
    )
  }

  render() {
    return (
      <Table striped bordered condensed hover>
        <thead>
          <tr>
            <th>#</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {this.state.newUserRequests.map((request, i) => this.getTableRow(request, i))}
        </tbody>
      </Table>
    );
  }
}


export default NewUserRequestsContainer
