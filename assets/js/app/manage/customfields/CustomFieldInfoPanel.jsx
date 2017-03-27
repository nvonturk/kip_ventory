import React from 'react'
import { Grid, Row, Col, Panel} from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

const CustomFieldInfoPanel = React.createClass({
  getInitialState() {
    return {}
  },

  render() {
    return (
      <Panel style={{fontSize: '12px'}} header={
        <Row style={{fontSize: '15px'}}>
          <Col sm={3}>Field Type</Col>
          <Col sm={6}>Definition</Col>
          <Col sm={3}>Example</Col>
        </Row>
      }>
        <Row>
          <Col sm={3}><p>Short Text</p></Col>
          <Col sm={6}>Small text fields, single-line only</Col>
          <Col sm={3}>Item name</Col>
        </Row>
        <Row>
          <Col sm={3}><p>Long Text</p></Col>
          <Col sm={6}>Larger, multi-line text fields</Col>
          <Col sm={3}>Item description</Col>
        </Row>
        <Row>
          <Col sm={3}><p>Integer</p></Col>
          <Col sm={6}>Whole numbers only</Col>
          <Col sm={3}>Item quantity</Col>
        </Row>
        <Row>
          <Col sm={3}><p>Float</p></Col>
          <Col sm={6}>Integer or decimal numbers</Col>
          <Col sm={3}>Item price</Col>
        </Row>
      </Panel>
    )
  }
});

export default CustomFieldInfoPanel
