import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'

function LogEntry(props){
  var affectedUser = "N/A"
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
      <td data-th="Item" className="text-left">{props.log.default_item}</td>
      <td data-th="Quantity" className="text-left">{props.log.quantity}</td>
      <td data-th="Message" className="text-left">{props.log.message}</td>
    </tr>
)


}

export default LogEntry
