import React from 'react'
import SimpleRequest from './simplerequest'
import { Button, Panel } from 'react-bootstrap'

function Request(props){
  var html = null;
  var constant_html = getReq(props);

  if(props.request.status == "O"){
    html = <Button bsStyle="primary" onClick={() => props.deleteRequest(props.request)} className="deleteRequestButton">Delete Request</Button>

  } else{
    html = "Put expanded view here";
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

export default Request
