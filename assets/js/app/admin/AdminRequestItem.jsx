import React from 'react'
import { Row, Col, Button, Panel, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'

const AdminRequestItem = React.createClass({

  getInitialState(){
    return ({quantity: this.props.request.quantity, closed_comment: ""})
  },

  parseDate(dateStr){
    return String(new Date(dateStr))
  },

  getPanelHeader(){
    return(
      <div>
        <Row>
          <Col xs={2} md={2}><b>User:</b> {this.props.request.requester.username}</Col>
          <Col xs={6} md={5}><b>Date:</b> {this.parseDate(this.props.request.date_open)}</Col>
          <Col xs={1} md={3}><b>Item:</b> {this.props.request.item.name}</Col>
          <Col xs={3} md={2}><b>Quantity:</b> {this.props.request.quantity}</Col>
        </Row>
        <Row>
          <Col xs={12} md={12}><b>Open Reason:</b> {this.props.request.open_reason}</Col>
        </Row>
      </div>
  )},

  handleChange(event) {
    console.log(event.target.value)
    this.setState({ [event.target.name]: event.target.value });
  },

  render() {
    // Need to return in a window all of the requests

    return (
      <div>
      <Panel collapsible header={this.getPanelHeader()}>
        <FormGroup controlId="requestForm">
          <ControlLabel>Quantity</ControlLabel>
          <FormControl
            type="number"
            name="quantity"
            value={this.state.quantity}
            placeholder={this.state.quantity}
            onChange={this.handleChange}
          />
          <ControlLabel>Closed Comment</ControlLabel>
          <FormControl
            type="text"
            name="closed_comment"
            value={this.state.closed_comment}
            placeholder={this.state.closed_comment}
            onChange={this.handleChange}
          />
        </FormGroup>
      </Panel>
    </div>
  )

}
})

export default AdminRequestItem
