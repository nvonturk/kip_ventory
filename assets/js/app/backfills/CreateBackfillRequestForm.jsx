import React, { Component } from 'react'
import { Panel, Row, Col, Form, FormGroup, FormControl, Button, ControlLabel} from 'react-bootstrap'
import { FileChooser } from '../FileChooser'

class CreateBackfillRequestForm extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
      <Form>
        <Row>
          <Col xs={12}>
            <FormGroup bsSize="small" controlId="requester_comment" validationState={this.props.getValidationState("requester_comment")}>
              <ControlLabel>Comment<span style={{color:"red"}}>*</span></ControlLabel>
              <FormControl componentClass="textarea"
                           type="text"
                           name="requester_comment"
                           value={this.props.comment}
                           onChange={this.props.handleFormChange}/>
              { this.props.errorNodes['requester_comment'] }
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={6} xs={12}>
            <FormGroup bsSize="small" controlId="receipt" validationState={this.props.getValidationState('receipt')}>
              <ControlLabel>Proof of Purchase<span style={{color:"red"}}>*</span></ControlLabel>
              <FormControl  type="file" 
                            name="Choose file"
                            onChange={this.props.handleFileChange} />

              { this.props.errorNodes['receipt'] }
            </FormGroup>
          </Col>
        </Row>
      </Form>
    )
	}
}

export default CreateBackfillRequestForm