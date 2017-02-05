import React from 'react'
import SimpleRequest from './simplerequest'
import { Button } from 'react-bootstrap'

function Request(props){
  return (<div>
    <b>Item:</b> {props.request.item.name}  <SimpleRequest request={props.request}/>
    <Button bsStyle="primary" onClick={() => props.deleteRequest(props.request)} className="deleteRequestButton">Delete Request</Button>
    </div>)
}

export default Request
