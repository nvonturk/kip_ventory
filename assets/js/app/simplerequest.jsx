import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'

function SimpleRequest(props){

  return (
    <div>
      <b>Requester:</b> {props.request.requester.username}
      <b>Quantity:</b> {props.request.quantity}        
      <b>Opened:</b> {props.request.date_open.substring(0,9)}
    </div>
  )

}

export default SimpleRequest
