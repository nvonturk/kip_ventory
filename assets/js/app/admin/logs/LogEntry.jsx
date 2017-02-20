import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'

function LogEntry(props){
  var affectedUser = "N/A"
  if (props.log.affected_user != null){
    affectedUser = props.log.affected_user.username
  }

  return (<div>
    <p>Initiating User: {props.log.initiating_user.username}</p>
    <p>Affected User: {affectedUser}</p>
    <p>Date: {props.date}</p>
    <p>Category: {props.log.category}</p>
    <p>Item: {props.log.item.name}</p>
    <p>Quantity: {props.log.quantity}</p>
  </div>
)


}

export default LogEntry
