import React, {Component} from 'react'
import LogEntry from './LogEntry'
import { ListGroup, ListGroupItem, Label, Row, Col, Grid, Well, Button } from 'react-bootstrap'
import $ from 'jquery'
import SimpleDropdown from '../../SimpleDropdown'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import LogEntryContainer from './LogEntryContainer'
import DateRangePicker from 'react-bootstrap-daterangepicker'

class LogsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      logs:[],
      users: [],
      userlist: [],
      currentuser: null,
      currentitem: null,
      itemlist: [],
      items: [],
      currentenddate: null,
      currentstartdate: null,
    }
    this.getAllLogs = this.getAllLogs.bind(this)
    this.filter = this.filter.bind(this)
    this.setLogs = this.setLogs.bind(this)
    this.getUsers = this.getUsers.bind(this)
    this.createUserlist = this.createUserlist.bind(this)
    this.changeUser = this.changeUser.bind(this)
    this.changeItem = this.changeItem.bind(this)
    this.createItemlist = this.createItemlist.bind(this)
    this.getItems = this.getItems.bind(this)
    this.changeDate = this.changeDate.bind(this)
    this.clearSearch = this.clearSearch.bind(this)

    this.getAllLogs()
    this.getUsers()
    this.getItems()
  }

  setLogs(data){
    this.setState({
      logs: data,
    })
  }

  getUsers(){
    var thisObj = this
    $.getJSON("/api/users.json", function(data){
      thisObj.setState({users: data})
      thisObj.createUserlist(data)
    });
  }

  getItems(){
    var thisObj = this
    $.getJSON("/api/items.json", function(data){
      thisObj.setState({items: data.results})
      thisObj.createItemlist(data.results)
    });  }

  createUserlist(data){
    var list = []
    for (var i = 0; i < data.length; i++){
      list.push({value: data[i].username, label: data[i].username})
    }
    this.setState({userlist: list})
  }

  createItemlist(data){
    var list = []
    for (var i = 0; i < data.length; i++){
      list.push({value: data[i].name, label: data[i].name})
    }
    this.setState({itemlist: list})
  }

  getAllLogs() {
    var params = {
      user: null,
      startDate: null,
      endDate: null,
      item: null,
    }
    this.getLogs(params)
  }

  getLogs(params) {
    var thisobj = this;
    $.getJSON("/api/logs.json", params, function(data) {
      thisobj.setLogs(data);
    })
  }

  changeUser(event){
    this.setState({currentuser: event}, () => {this.filter();})
  }

  changeItem(event){
    this.setState({currentitem: event}, () => {this.filter();})
  }

  changeDate(event, picker){
    this.setState({currentstartdate: picker.startDate.toString(),
    currentenddate: picker.endDate.toString()}, () => {this.filter();})
  }

  clearSearch(event){
    this.setState({
      currentenddate: null,
      currentstartdate: null,
      currentuser: null,
      currentitem: null,
    }, () => {this.getAllLogs()})
  }

  filter(){
    var params = {
      user: this.state.currentuser,
      item: this.state.currentitem,
      startDate: this.state.currentstartdate,
      endDate: this.state.currentenddate,
    }
    this.getLogs(params);
  }

  render(){

    return(
      <Grid fluid>
        <Row>
          <Col md = {4} xs = {4}>
            <Select ref="userSelect" autofocus options={this.state.userlist} simpleValue clearable={true} placeholder="Select User" name="selected-user" value={this.state.currentuser} onChange={this.changeUser} searchable={true}/>
          </Col>
          <Col md = {4} xs = {4}>
            <Select ref="itemSelect" autofocus options={this.state.itemlist} simpleValue clearable={true} placeholder="Select Item" name="selected-item" value={this.state.currentitem} onChange={this.changeItem} searchable={true}/>
          </Col>
          <Col md = {2} xs = {2}>
            <Well>
              <DateRangePicker onApply={this.changeDate}>Pick Date</DateRangePicker>
            </Well>
          </Col>
          <Col md = {2} xs = {2}>
            <Button onClick={this.clearSearch}>Clear</Button>
          </Col>
        </Row>
        <Row>
          <Col md = {9} xs = {9}>
            <LogEntryContainer className="log-list" logs={this.state.logs} />
          </Col>
        </Row>
      </Grid>
    )
  }

}

export default LogsContainer
