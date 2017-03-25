import React, {Component} from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button, HelpBlock } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import Moment from 'moment'

require('react-datepicker/dist/react-datepicker.css');
require('react-datepicker/dist/react-datepicker-cssmodules.css');

class LoanReminderForm extends Component {
  constructor(props) {
    super(props);
  }

  
  render() {
  	return (
  		<Grid fluid>
        <Row>
          <Col sm={12}>
            <p>
              Use this form to schedule an email to be sent to all users with recorded loans.
            </p>
            <br />
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <Form horizontal>
              <Panel>
                <FormGroup bsSize="small">
                  <Col componentClass={ControlLabel} sm={2}>
                    Subject
                  </Col>
                  <Col sm={9} >
                    <FormControl
                      type="text"
                      name="subject"
                      value={this.props.subject}
                      onChange={this.props.handleLoanReminderFieldChange}
                    />
                  </Col>
                </FormGroup>

                <FormGroup bsSize="small">
                  <Col componentClass={ControlLabel} sm={2}>
                    Body
                  </Col>
                  <Col sm={9} >
                    <FormControl
                      type="text"
                      style={{resize: "vertical", height:"100px"}}
                      componentClass={"textarea"}
                      name="body"
                      value={this.props.body}
                      onChange={this.props.handleLoanReminderFieldChange}
                    />
                  </Col>
                </FormGroup>

                <FormGroup bsSize="small">
                  <Col componentClass={ControlLabel} sm={2}>
                    Date
                  </Col>
                  <Col sm={9}>
                  	<DatePicker selected={this.props.date == null ? null : Moment(this.props.date)} onChange={this.props.handleDateChange} />
                	</Col>
                </FormGroup>
              </Panel>
            </Form>
          </Col>
        </Row>
      </Grid>
  	)
  }
}

export default LoanReminderForm
