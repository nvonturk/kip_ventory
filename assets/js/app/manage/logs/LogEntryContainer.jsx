import React from 'react'
import { Table, Label } from 'react-bootstrap'
import LogEntry from './LogEntry'

function LogEntryContainer(props){
  var list = [];

  list = props.logs.map(function(log, i){
    return (<LogEntry key={i} log={log}/>);
  });
  return(
    <Table hover>
      <thead>
        <tr>
          <th style={{width:'10%'}} className="text-left">Initiating User</th>
          <th style={{width:'10%'}} className="text-left">Affected User</th>
          <th style={{width:'10%'}} className="text-left">Date</th>
          <th style={{width:'10%'}} className="text-left">Category</th>
          <th style={{width:'15%'}} className="text-left">Item</th>
          <th style={{width:'10%'}} className="text-left">Request</th>
          <th style={{width:'5%'}} className="text-left">Quantity</th>
          <th style={{width:'20%'}} className="text-left">Message</th>
        </tr>
      </thead>
      <tbody>
        { list }
      </tbody>
    </Table>
  )
}

export default LogEntryContainer
