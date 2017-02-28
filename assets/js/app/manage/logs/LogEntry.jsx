import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import {Link, browserHistory} from 'react-router'

function LogEntry(props){
  var affectedUser = "N/A"
  console.log(props)
  var requester_url = "/app/items/" + props.log.default_item + "/"
  console.log(requester_url)
  if (props.log.affected_user != null){
    affectedUser = props.log.affected_user
  }
  var dateString = new Date(props.log.date_created).toLocaleString()

  return (
    <tr>
      <td data-th="Initiating User" className="text-left">{props.log.default_initiating_user}</td>
      <td data-th="Affected User" className="text-left">{affectedUser}</td>
      <td data-th="Date" className="text-left">{dateString}</td>
      <td data-th="Category" className="text-left">{props.log.category}</td>
      <td data-th="Item" className="text-left"> <a href={requester_url}>{props.log.default_item}</a></td>
      <td data-th="Quantity" className="text-left">{props.log.quantity}</td>
      <td data-th="Message" className="text-left">{props.log.message}</td>
    </tr>
)


}

export default LogEntry
