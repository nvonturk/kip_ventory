import React, {Component} from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button, HelpBlock, Modal } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import Moment from 'moment'
import LoanReminderForm from './LoanReminderForm'
import $ from 'jquery'
import { getCookie, CSRFToken } from '../../../csrf/DjangoCSRFToken'


require('react-datepicker/dist/react-datepicker.css');
require('react-datepicker/dist/react-datepicker-cssmodules.css');

class LoanReminderModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
    	subject: "",
    	body: "",
    	date: null,
    }
   
   	this.handleLoanReminderFieldChange = this.handleLoanReminderFieldChange.bind(this);
   	this.handleDateChange = this.handleDateChange.bind(this);
    this.createLoanReminder = this.createLoanReminder.bind(this);


  }

  createLoanReminder() {
    console.log("create");

    var thisobj = this;
    $.ajax({
      url: "/api/loanreminders/",
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify({
        subject: this.state.subject,
        body: this.state.body,
        date: this.state.date.toISOString(),
      }),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        thisobj.clearForm();
        thisobj.props.createLoanReminderSuccessHandler();
      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
    
  }

  clearForm() {
    this.setState({
      subject: "",
      body: "",
      date: null,
    });
  }

  handleLoanReminderFieldChange(e) {
    console.log(e);
    e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  handleDateChange(date) {
    this.setState({
      date: date
    });
  }

  getLoanReminderCreationForm() {
    return <LoanReminderForm subject={this.state.subject} body={this.state.body} date={this.state.date} handleDateChange={this.handleDateChange} handleLoanReminderFieldChange={this.handleLoanReminderFieldChange}/>
  }
  
  render() {
    return (
     <Modal show={this.props.show} onHide={this.props.onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Add Loan Reminder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { this.getLoanReminderCreationForm() }
        </Modal.Body>
        <Modal.Footer>
          <Button bsSize="small" onClick={this.props.onHide}>Cancel</Button>
          <Button bsStyle="info" bsSize="small" onClick={this.createLoanReminder}>Create</Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export default LoanReminderModal
  
