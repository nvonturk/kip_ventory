import React, { Component } from 'react'
import SimpleRequest from '../../SimpleRequest'
import { Button, Panel, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'

class AdminRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity: this.props.request.quantity,
      closed_comment: this.props.request.closed_comment
    };
  }

  handleChange(name, e) {
    var change = {};
    change[name] = e.target.value;
    this.setState(change);
  }


  render(){
    var constant_html = this.getReq(this.props);

    var html;
    if(this.props.request.status == "O"){
      html = (
        <div>
          <Button bsStyle="primary" onClick={() => this.props.deleteRequest(props.request)} className="deleteRequestButton">Delete Request</Button>
          {this.getForm(this.props)}
        </div>
      );
    }
    else{
      html = this.getInfo(this.props);
    }

    return (
      <div>
        <Panel collapsible header={constant_html}>
          {html}
        </Panel>
      </div>);
  }

  getReq(props){
    return (
      <div>
        <b>Item:</b> {props.request.item.name}
        <SimpleRequest request={props.request}/>
      </div>
    );
  }

  getInfo(props){
      return (
        <div>
        <p><b>User Comments:</b> {props.request.open_reason} </p>
        <p><b>Administrator:</b> {props.request.administrator.username} </p>
        <p><b>Admin Comments:</b> {props.request.closed_comment} </p>
        <p><b>Date Closed:</b> {props.request.date_closed.substring(0,9)} </p>
        </div>
      );
  }

  getForm(props){
    return (
      <div>
        <FormGroup controlId="requestForm">
          <ControlLabel>Quantity</ControlLabel>
          <FormControl
            type="number"
            name="quantity"
            value={this.state.quantity}
            placeholder={this.state.quantity}
            onChange={this.handleChange.bind(this, 'quantity')}
          ></FormControl>
          <ControlLabel>Closed Comment</ControlLabel>
          <FormControl
            type="text"
            name="closed_comment"
            value={this.state.closed_comment ? this.state.closed_comment : ""}
            placeholder={this.state.closed_comment}
            onChange={this.handleChange.bind(this, 'closed_comment')}
          ></FormControl>
        </FormGroup>
        <Button bsStyle="success" onClick={(e) => this.props.submit(e, this.props.request, "approved",this.state.quantity, this.state.closed_comment)}>Approve</Button>
        <Button bsStyle="danger" onClick={(e) => this.props.submit(e, this.props.request, "denied", this.state.quantity, this.state.closed_comment)}>Deny</Button>
      </div>
    );
  }
}


export default AdminRequest
