import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import SimpleRequest from './simplerequest'
function Request(props){
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
  return <div><b>Item:</b> {props.request.item.name}  <SimpleRequest request={props.request}/></div>
}

export default Request