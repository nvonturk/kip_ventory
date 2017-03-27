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
          <Row>
            <Col xs={12}>
              <div className="panel panel-default">
                <div className="panel-heading">
                  <Row>
                    <Col xs={12}>
                      <span className="panel-title" style={{fontSize:"15px"}}>Configure Subject Tag</span>
                    </Col>
                  </Row>
                </div>
                <div className="panel-body">
                  <div className="info">
                    <p>This subject tag is a small piece of text to be prepended to the subject line of all emails sent by the system</p>
                  </div>
                  <SubjectTag />
                </div>
              </div>
            </Col>
          </Row>
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
            <h3>Configure Emails</h3>
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
