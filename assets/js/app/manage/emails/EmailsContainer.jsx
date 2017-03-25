import React, {Component} from 'react'
import { ListGroup, ListGroupItem, Label, Row, Col, Grid, Panel, Well, Button, Glyphicon, Modal } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import LoanRemindersContainer from './LoanRemindersContainer'
import SubjectTag from './SubjectTag'

class EmailsContainer extends Component {
  constructor(props) {
    super(props);
    this.user = this.props.route.admin;
    this.state = {
     
    }
   
  }

  getAdminView() {
    if(this.user.is_superuser) {
      return (
        <Panel>
            <h4>Configure Subject Tag</h4>
            <hr></hr>
            <p>This subject tag is a small piece of text to be prepended to the subject line of all emails sent by the system</p>
            <SubjectTag />
        </Panel>
      )
    } else {
      return "";
    }
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
        <Row>
          <Col xs={12}>
            {this.getAdminView()}
            <LoanRemindersContainer loanReminders={this.state.loanReminders}/>
          </Col>
        </Row>
      </Grid>
    )
  }

}

export default EmailsContainer
