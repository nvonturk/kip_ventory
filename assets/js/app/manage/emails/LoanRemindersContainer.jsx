import React, {Component} from 'react'
import { Table} from 'react-bootstrap'

class LoanRemindersContainer extends Component {
	constructor(props) {
		super(props)
	}

	getLoanReminderStatus(loanReminder) {
		return loanReminder.sent ? "Sent" : "Not Sent"
	}

	getTableRow(loanReminder, i) {
    return (
      <tr key={loanReminder.id}>
      	<td>{i+1}</td>
        <td>{loanReminder.date}</td>
        <td>{loanReminder.subject}</td>
        <td>{loanReminder.body}</td>
        <td>{this.getLoanReminderStatus(loanReminder)}</td>
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
        </tr>
      </thead>
    )
 }

	render() {
		return (
			<Table bordered condensed hover>
	      {this.getTableHeader()}
	      <tbody>
 					{this.props.loanReminders.map((loanReminder, i) => this.getTableRow(loanReminder, i))}	          
 				</tbody>
	    </Table>
		)
	}
}

export default LoanRemindersContainer