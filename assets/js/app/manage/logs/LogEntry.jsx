import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import {Link, browserHistory} from 'react-router'

function LogEntry(props){
  var affectedUser = "N/A"
  console.log(props)
  var requester_url = "/app/items/" + props.log.default_item + "/"
  console.log(requester_url)
  if (props.log.affected_user != null){
    affectedUser = props.log.affected_user.username
  }

  return (
    <div>
      <p>Initiating User: {props.log.default_initiating_user}</p>
      <p>Affected User: {props.log.default_affected_user}</p>
      <p>Date: {props.log.date_created}</p>
      <a href={requester_url} >Item: {props.log.default_item}</a>
      <p>Category: {props.log.category}</p>
      <p>Quantity: {props.log.quantity}</p>
      <p>Message: {props.log.message}</p>
    </div>
)


}

export default LogEntry
