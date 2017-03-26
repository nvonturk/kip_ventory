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
  }

  getLoanReminderForm() {
    return <LoanReminderForm subject={this.props.loanReminder.subject} body={this.props.loanReminder.body} date={this.props.loanReminder.date} handleDateChange={this.props.handleDateChange} handleLoanReminderFieldChange={this.props.handleLoanReminderFieldChange}  errorNodes={this.props.errorNodes}/>
  }

  getCreateFooterView() {
    return this.getFooterView(this.props.createLoanReminder, "Create");
  }

  getSaveFooterView() {
    return this.getFooterView(this.props.saveLoanReminderToEdit, "Save");
  }

  getFooterView(onClick, label) {
    return (
      <div>
        <Button bsSize="small" onClick={this.props.onHide}>Cancel</Button>
        <Button bsStyle="info" bsSize="small" onClick={onClick}>{label}</Button>
      </div>
    )
  }

  getFooter() {
    if(this.props.new) {
      return this.getCreateFooterView();
    } else {
      return this.getSaveFooterView();
    }
  }

  getTitle() {
    if(this.props.new) {
      return "Create Loan Reminder";
    } else {
      return "Edit Loan Reminder";
    }
  }

  
  render() {
    return (
     <Modal show={this.props.show} onHide={this.props.onHide}>
        <Modal.Header closeButton>
          <Modal.Title>{ this.getTitle() }</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { this.getLoanReminderForm() }
        </Modal.Body>
        <Modal.Footer>
          { this.getFooter() }
        </Modal.Footer>
      </Modal>
    )
  }
}

export default LoanReminderModal
