import React, { Component } from 'react'
import { Panel, Row, Col, Form, FormGroup, FormControl, Button} from 'react-bootstrap'

//<FileChooser instructions={} handleFileSubmit={} handleFileChange={}/>
class FileChooser extends Component {

	constructor(props) {
		super(props);

	}

	render() {
		return (
      <Panel>
        <Row>
          <Col md={12} xs={6}>
            <p style={{fontSize:"12px"}}>
              {this.props.instructions}
            </p>
          </Col>
          <Col md={12} xs={6}>
            <Form onSubmit={this.props.handleFileSubmit}>
              <FormGroup bsSize="small">
                  <FormControl type="file" label="Choose file" style={{fontSize:"10px"}} bsStyle="default" onChange={this.props.handleFileChange} />
              </FormGroup>
              <Button style={{fontSize:"10px"}} type="submit" bsSize="small" bsStyle="info">Upload</Button>
            </Form>
          </Col>
        </Row>
      </Panel>
    )
	}
}

export default FileChooser