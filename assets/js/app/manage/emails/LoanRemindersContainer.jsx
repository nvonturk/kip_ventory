import React, {Component} from 'react'
import { Nav, NavItem, Button, Glyphicon, Modal, Table} from 'react-bootstrap'
import LoanReminderModal from './LoanReminderModal'
import $ from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class LoanRemindersContainer extends Component {
	constructor(props) {
		super(props)
    this.state = {
      showLoanReminderCreationModal: false, 
      loanReminders: [],
      activeKey:0
    }

    this.showCreateLoanReminderForm = this.showCreateLoanReminderForm.bind(this);   
    this.hideCreateLoanReminderForm = this.hideCreateLoanReminderForm.bind(this);
    this.createLoanReminderSuccessHandler = this.createLoanReminderSuccessHandler.bind(this);
    this.filterLoanReminders = this.filterLoanReminders.bind(this);

    this.getLoanReminders();
	}

  getLoanReminders() {
    var _this = this;
    var sent = this.state.activeKey == 0 ? false : true; //get sent or scheduled loan reminders
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

  filterLoanReminders(activeKey) {
    this.setState({
      activeKey: activeKey
    }, this.getLoanReminders);
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

	getLoanReminderStatus(loanReminder) {
		return loanReminder.sent ? "Sent" : "Scheduled"
	}

	getTableRow(loanReminder, i) {
    return (
      <tr key={loanReminder.id}>
      	<td>{i+1}</td>
        <td>{loanReminder.date}</td>
        <td>{loanReminder.subject}</td>
        <td>{loanReminder.body}</td>
        <td>{this.getLoanReminderStatus(loanReminder)}</td>
        <td><Glyphicon glyph="pencil" onclick /></td>
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
          <th>Status</th>
          <th></th> //actions
        </tr>
      </thead>
    )
 }

	render() {
		return (
      <div>
        <span className="panel-title" style={{fontSize:"15px"}}>Loan Reminders</span>
        <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showCreateLoanReminderForm}>
          Add Loan Reminder &nbsp; <Glyphicon glyph="plus" />
        </Button>
         <Nav bsStyle="pills" justified activeKey={this.state.activeKey} onSelect={this.filterLoanReminders}>
          <NavItem eventKey={0} title="scheduled">Scheduled</NavItem>
          <NavItem eventKey={1} title="sent">Sent</NavItem>
        </Nav>
    		<Table bordered condensed hover>
          {this.getTableHeader()}
          <tbody>
    					{this.state.loanReminders.map((loanReminder, i) => this.getTableRow(loanReminder, i))}	          
    				</tbody>
        </Table>
        <LoanReminderModal show={this.state.showLoanReminderCreationModal} onHide={this.hideCreateLoanReminderForm} createLoanReminderSuccessHandler={this.createLoanReminderSuccessHandler}/>
      </div>
		)
	}
}

export default LoanRemindersContainer
