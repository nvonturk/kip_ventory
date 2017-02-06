import React from 'react'
import SimpleRequest from './SimpleRequest'
import { Button, Panel } from 'react-bootstrap'

function Request(props){
    var html = null;
    var constant_html = getReq(props);
    if(props.request.status == "O"){
      html = <Button bsStyle="primary" onClick={() => props.deleteRequest(props.request)} className="deleteRequestButton">Delete Request</Button>
    }
    else{
      html = getInfo(props);
    }

    return (<div>
      <Panel collapsible header={constant_html}>
      {html}
      </Panel>
      </div>)
}

function getReq(props){
  return (
    <div>
    <b>Item:</b> {props.request.item.name}  <SimpleRequest request={props.request}/>
    </div>
  );
}

function getInfo(props){
  return (
    <div>
    <p><b>User Comments:</b> {props.request.open_reason} </p>
    <p><b>Administrator:</b> {props.request.administrator.username} </p>
    <p><b>Admin Comments:</b> {props.request.closed_comment} </p>
    <p><b>Date Closed:</b> {props.request.date_closed.substring(0,9)} </p>
    </div>
  );
}

export default Request
