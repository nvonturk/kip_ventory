import React, {Component} from 'react'
import Checkbox from './Checkbox'
import { ListGroup, ListGroupItem, Label, Row, Col, Grid, Panel, Well, Button, Glyphicon, Modal } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'


class EmailSubscriptionContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: this.props.user,
    }
    this.handleSubcriptionChange = this.handleSubcriptionChange.bind(this);   
  }

  saveSubscriptionChange() {
    var _this = this;
    $.ajax({
      url:"/api/users/edit/" + this.state.user.username + "/",
      type: "PUT",
      contentType:"application/json; charset=utf-8",
      processData: false,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: JSON.stringify(this.state.user),
      traditional: true,
      success:function(response){
        console.log("success");
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        //todo show error message
        console.log("error");
      }
    });
  }

  handleSubcriptionChange(isSubcribed, label) {
    this.setState(function(prevState, props){
      prevState.user.profile.subscribed = isSubcribed;
      return {
        user: prevState.user
      }
    }, this.saveSubscriptionChange);
  }

  getSubscribedLabel() {
    console.log("test");
    if(this.state.user.profile.subscribed) {
      return "You are subscribed to emails.";
    } else {
      return "You are not subscribed to emails.";
    }
  }

  render(){

    return(
      <div>
        <h3>Email Subscription</h3>
        <hr></hr>
        <p>Check the box if you want to receive emails for every user request</p>
        <Checkbox startChecked={this.state.user.profile.subscribed} label={this.getSubscribedLabel()} handleCheckboxChange={this.handleSubcriptionChange}/>
      </div>
    )
  }

}

export default EmailSubscriptionContainer
