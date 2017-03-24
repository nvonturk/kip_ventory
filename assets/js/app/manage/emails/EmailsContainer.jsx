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
            <SubjectTag />
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
            <h3>Emails</h3>
            <hr />
            <p>
              Configure and schedule emails.
            </p>
            <br />
          </Col>
        </Row>

        <Panel>
          {this.getAdminView()}
          <Row>
            <Col xs={12}>
              <LoanRemindersContainer loanReminders={this.state.loanReminders}/>
            </Col>
          </Row>
        </Panel>
      </Grid>
    )
  }

}

export default EmailsContainer
