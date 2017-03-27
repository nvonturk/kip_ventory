import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import {Link, browserHistory} from 'react-router'

function LogEntry(props){
  var affectedUser = "N/A"
  var item_url = "/app/inventory/" + props.log.default_item + "/"

  var request_url = null;
  console.log(props.log.request);
  if(props.log.request != null){
    var request_url = "/app/requests/" + props.log.request + "/"
  }

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
      <td data-th="Item" className="text-left">
        <span className="clickable"
              style={{fontSize: "11px", textDecoration: "underline", color: "#5bc0de"}}
              onClick={e => {browserHistory.push(item_url)}}>
            {props.log.default_item}
        </span>
      </td>
      <td data-th="Request" className="text-left">
        { props.log.request != null ? (
          <span className="clickable"
              style={{fontSize: "11px", textDecoration: "underline", color: "#5bc0de"}}
              onClick={e => {browserHistory.push(request_url)}}>
            Click to view
          </span>) : null }
      </td>
      <td data-th="Quantity" className="text-left">{props.log.quantity}</td>
      <td data-th="Message" className="text-left">{props.log.message}</td>
    </tr>
)


}

export default LogEntry
