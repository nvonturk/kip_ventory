import React from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import LogEntry from './LogEntry'

function LogEntryContainer(props){
  var list = [];
  props.logs.map(function(log, i){
    var date = new Date(log.date_created)
    date = date.toString()
    list.push(<ListGroupItem key={i}><LogEntry log={log} date={date}/></ListGroupItem>);
    console.log(log)
  });
  return(
    <div>
      <ListGroup>
        {list}
      </ListGroup>
    </div>
  )
}

export default LogEntryContainer
