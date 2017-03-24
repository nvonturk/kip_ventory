import React, {Component} from 'react'
import Checkbox from './Checkbox'
import { ListGroup, ListGroupItem, Label, Row, Col, Grid, Panel, Well, Button, Glyphicon, Modal } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import LoanReminderModal from './LoanReminderModal'
import LoanRemindersContainer from './LoanRemindersContainer'

class EmailSubscriptionContainer extends Component {
  constructor(props) {
    super(props);
    this.user = this.props.route.admin;
    this.state = {
      showLoanReminderCreationModal: false, 
      loanReminders: []
    }
    this.handleSubcriptionChange = this.handleSubcriptionChange.bind(this);
    this.showCreateLoanReminderForm = this.showCreateLoanReminderForm.bind(this);   
    this.hideCreateLoanReminderForm = this.hideCreateLoanReminderForm.bind(this);
    this.createLoanReminderSuccessHandler = this.createLoanReminderSuccessHandler.bind(this);

    this.getLoanReminders();
  }

  handleSubcriptionChange(isSubcribed, label) {
    console.log(isSubcribed);
    this.user.profile.subscribed = isSubcribed;
    console.log(this.user);
    var _this = this;
    $.ajax({
      url:"/api/users/edit/" + this.user.username + "/",
      type: "PUT",
      contentType:"application/json; charset=utf-8",
      processData: false,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: JSON.stringify(this.user),
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

  getLoanReminders() {
    var _this = this;
    $.ajax({
      url:"/api/loanreminders/",
      type: "GET",
      contentType:"application/json",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(data){
        console.log("success");
        _this.setState({
          loanReminders: data.results
        })
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        //todo show error message
        console.log("error");
      }
    });
  }

  showCreateLoanReminderForm() {
    this.setState({
      showLoanReminderCreationModal: true
    })
  }

  hideCreateLoanReminderForm() {
    this.setState({
      showLoanReminderCreationModal: false
    })
  }

  createLoanReminderSuccessHandler() {
    this.getLoanReminders()
    this.hideCreateLoanReminderForm();
  }

  render(){

    return(
      <Grid fluid>
        <Row>
          <Col xs={12}>
            <h3>Emails</h3>
            <hr />
            <p>
              Configure and schedule emails.
            </p>
            <br />
          </Col>
        </Row>

        <Panel>
          <Row>
            <Col xs={12}>
              <Checkbox startChecked={this.user.profile.subscribed} label={"Subscribed?"} handleCheckboxChange={this.handleSubcriptionChange}/>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col xs={12}>
              <span className="panel-title" style={{fontSize:"15px"}}>Loan Reminders</span>
              <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showCreateLoanReminderForm}>
                Add Loan Reminder &nbsp; <Glyphicon glyph="plus" />
              </Button>
              <LoanRemindersContainer loanReminders={this.state.loanReminders}/>
            </Col>
          </Row>
        </Panel>
        <LoanReminderModal show={this.state.showLoanReminderCreationModal} onHide={this.hideCreateLoanReminderForm} createLoanReminderSuccessHandler={this.createLoanReminderSuccessHandler}/>
      </Grid>
    )
  }

}

export default EmailSubscriptionContainer
