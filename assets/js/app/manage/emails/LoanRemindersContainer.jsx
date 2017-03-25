import React, {Component} from 'react'
import { Nav, NavItem, Button, Glyphicon, Modal, Table, Col, Grid, Row} from 'react-bootstrap'
import LoanReminderModal from './LoanReminderModal'
import $ from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class LoanRemindersContainer extends Component {
	constructor(props) {
		super(props)
    this.state = {
      showCreateLoanReminderModal: false, 
      showEditLoanReminderModal: false,
      loanReminders: [],
      loanReminderToEditOrCreate: {
        subject: "",
        body: "",
        date: null,
      },
    }

    this.showCreateLoanReminderModal = this.showCreateLoanReminderModal.bind(this);   
    this.hideCreateLoanReminderModal = this.hideCreateLoanReminderModal.bind(this);
    this.createLoanReminderSuccessHandler = this.createLoanReminderSuccessHandler.bind(this);
    this.hideEditLoanReminderModal = this.hideEditLoanReminderModal.bind(this);
    this.handleLoanReminderFieldChange = this.handleLoanReminderFieldChange.bind(this);
    this.handleLoanReminderDateChange = this.handleLoanReminderDateChange.bind(this);
    this.createLoanReminder = this.createLoanReminder.bind(this);
    this.saveLoanReminderToEdit = this.saveLoanReminderToEdit.bind(this);

    this.getLoanReminders();
	}

  getLoanReminders() {
    var _this = this;
    var sent = false; //this.state.activeKey == 0 ? false : true; //get sent or scheduled loan reminders
    var url = "/api/loanreminders/";
    var params = {
      "sent": sent
    }
   
    $.getJSON(url, params, function(data) {
       _this.setState({
          loanReminders: data.results
      });
    })
  }

  showCreateLoanReminderModal() {
    this.setState({
      loanReminderToEditOrCreate: {
        subject: "",
        body: "",
        date: null,
      },
      showCreateLoanReminderModal: true
    })
  }

  hideCreateLoanReminderModal() {
    this.setState({
      showCreateLoanReminderModal: false
    })
  }

  createLoanReminderSuccessHandler() {
    this.getLoanReminders()
    this.hideCreateLoanReminderModal();
  }

  showEditLoanReminderModal(loanReminderIndex) {
    var loanReminder = $.extend({}, this.state.loanReminders[loanReminderIndex]); //copy so that form changes are not saved until user clicks save
    this.setState({
      loanReminderToEditOrCreate: loanReminder,
      showEditLoanReminderModal: true,
    });
  }

  hideEditLoanReminderModal() {
    this.setState({
      showEditLoanReminderModal: false
    })
  }

  handleLoanReminderFieldChange(e) {
    var name = e.target.name;
    var value = e.target.value;
    this.setState(function(prevState,props){
      prevState.loanReminderToEditOrCreate[name] = value;
      return {
        loanReminderToEditOrCreate: prevState.loanReminderToEditOrCreate
      }
    });
  }
 
  handleLoanReminderDateChange(date) {
    console.log(date);
    console.log(this.state.loanReminderToEditOrCreate);
    this.setState(function(prevState,props){
      prevState.loanReminderToEditOrCreate["date"] = date.toISOString();
      return {
        loanReminderToEditOrCreate: prevState.loanReminderToEditOrCreate
      }
    });
  }

  createLoanReminder() {
    console.log("create");

    var _this = this;
    $.ajax({
      url: "/api/loanreminders/",
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify(this.state.loanReminderToEditOrCreate),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.getLoanReminders();
        _this.hideCreateLoanReminderModal();
      },
      error:function (xhr, textStatus, thrownError){
        alert("Error creating loan reminder.")
      }
    });
    
  }

  saveLoanReminderToEdit() {
    console.log("save");
    var _this = this;
    $.ajax({
      url:"/api/loanreminders/" + this.state.loanReminderToEditOrCreate.id + "/",
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(this.state.loanReminderToEditOrCreate),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.getLoanReminders();
        _this.hideEditLoanReminderModal();
      },
      complete:function(){
      },
      error:function (xhr, textStatus, thrownError){
        alert("Error editing loan reminder.");
      }
    }); 
  }

  deleteLoanReminder(index) {
    var loanReminder = this.state.loanReminders[index];
    var _this = this;
    $.ajax({
      url:"/api/loanreminders/" + loanReminder.id + "/",
      contentType: "application/json",
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.getLoanReminders();
      },
      complete:function(){
      },
      error:function (xhr, textStatus, thrownError){
        alert("Error deleting loan reminder.");
      }
    });
  }

	getTableRow(loanReminder, i) {
    return (
      <tr key={loanReminder.id}>
      	<td>{i+1}</td>
        <td>{loanReminder.date}</td>
        <td>{loanReminder.subject}</td>
        <td>{loanReminder.body}</td>
        <td><span className="clickable"><Glyphicon glyph="pencil" onClick={this.showEditLoanReminderModal.bind(this, i)}/></span></td>
        <td><span className="clickable"><Glyphicon glyph="trash" onClick={this.deleteLoanReminder.bind(this, i)}/></span></td>
      </tr>
    )
 }

 getTableHeader() {
    return (
      <thead>
        <tr>
       	  <th>#</th>
          <th>Date</th>
          <th>Subject</th>
          <th>Body</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
    )
 }

	render() {
		return (
      <div>
          <Row>
            <Col xs={12}>
              <div className="panel panel-default">
                <div className="panel-heading">
                  <Row>
                    <Col xs={12}>
                      <span className="panel-title" style={{fontSize:"15px"}}>Schedule Loan Reminders</span>
                      <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showCreateLoanReminderModal}>
                        Add Loan Reminder &nbsp; <Glyphicon glyph="plus"/>
                      </Button>
                    </Col>
                  </Row>
                </div>
                <div className="panel-body">
                  <div className="info">
                    <p>
                      Each loan reminder will be sent to all users with recorded loans between 4am and 5am EST on the day specified.<br/>
                      The subject specified will be prepended by a subject tag, which is configurable by admins.<br/>
                      The body of the email will contain the specified, followed by a list of items loaned to the user<br/>
                    </p>
                  </div>
                  <Table bordered condensed hover>
                    {this.getTableHeader()}
                    <tbody>
                        {this.state.loanReminders.map((loanReminder, i) => this.getTableRow(loanReminder, i))}            
                      </tbody>
                  </Table>
                  <LoanReminderModal new={true} show={this.state.showCreateLoanReminderModal} onHide={this.hideCreateLoanReminderModal} loanReminder={this.state.loanReminderToEditOrCreate} handleDateChange={this.handleLoanReminderDateChange} handleLoanReminderFieldChange={this.handleLoanReminderFieldChange} saveLoanReminderToEdit={this.saveLoanReminderToEdit} createLoanReminder={this.createLoanReminder}/>
                  <LoanReminderModal new={false} show={this.state.showEditLoanReminderModal} onHide={this.hideEditLoanReminderModal} loanReminder={this.state.loanReminderToEditOrCreate} handleDateChange={this.handleLoanReminderDateChange} handleLoanReminderFieldChange={this.handleLoanReminderFieldChange} saveLoanReminderToEdit={this.saveLoanReminderToEdit} createLoanReminder={this.createLoanReminder}/>
                </div>
              </div>
            </Col>
          </Row>
      </div>
		)
	}
}

export default LoanRemindersContainer
