import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'

function SimpleRequest(props){
  var label = null;
  if(props.request.status=="O") {
    var label = <Label className="pull-right" bsStyle="warning">Outstanding</Label>
  }
  if(props.request.status=="A") {
    var label = <Label className="pull-right" bsStyle="success">Approved</Label>
  }
  if(props.request.status=="D") {
    var label = <Label className="pull-right" bsStyle="danger">Denied</Label>
  }

  if(label == null){
    console.log("Label equals null for " + props.request.status);
  }

  return <div><b>Requester:</b> {props.request.requester.username} <b>Quantity:</b> {props.request.quantity}        <b>Opened:</b> {props.request.date_open.substring(0,9)} {label}</div>
}

export default SimpleRequest