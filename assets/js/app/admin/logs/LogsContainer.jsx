import React, {Component} from 'react'
import LogEntry from './LogEntry'
import { Grid, Row, Col, Button, FormGroup, ControlLabel, FormControl } from 'react-bootstrap'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import $ from 'jquery'
import SimpleDropdown from '../../SimpleDropdown'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import 'react-select/dist/react-select.css'

class LogsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs:[],
    }
    this.getAllLogs = this.getAllLogs.bind(this)
    this.setLogs = this.setLogs.bind(this)
    this.getAllLogs()
  }

  setLogs(data){
    this.setState({
      logs: data,
    })
  }

  getAllLogs() {
    var thisobj = this;
    $.getJSON("/api/logs.json", function(data) {
      thisobj.setLogs(data);
    });
  }

  render(){
    var list = [];
    this.state.logs.map(function(log, i){
      var date = new Date(log.date_created)
      date = date.toString()
      list.push(<ListGroupItem key={i}><LogEntry log={log} date={date}/></ListGroupItem>);
    });

    return(
      <ListGroup>
        {list}
      </ListGroup>
    )
  }

}

export default LogsContainer
