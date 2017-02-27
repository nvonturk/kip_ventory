import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'

function LogEntry(props){
  var affectedUser = "N/A"
  if (props.log.affected_user != null){
    affectedUser = props.log.affected_user.username
  }

  return (
    <div>
      <p>Initiating User: {props.log.default_initiating_user}</p>
      <p>Affected User: {props.log.default_affected_user}</p>
      <p>Date: {props.log.date_created}</p>
      <p>Category: {props.log.category}</p>
      <p>Item: {props.log.default_item}</p>
      <p>Quantity: {props.log.quantity}</p>
      <p>Message: {props.log.message}</p>
    </div>
)


}

export default LogEntry
