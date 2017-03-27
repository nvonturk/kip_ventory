import React, {Component} from 'react'
import LogEntry from './LogEntry'
import { ListGroup, ListGroupItem, Label, Row, Col, Grid, Panel, Well, Button } from 'react-bootstrap'
import $ from 'jquery'
import SimpleDropdown from '../../SimpleDropdown'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import Select from 'react-select'
import LogEntryContainer from './LogEntryContainer'
import DateRangePicker from 'react-bootstrap-daterangepicker'
import Paginator from '../../Paginator'

const LOGS_PER_PAGE = 10;

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
      page: 1,
      pageCount: 0,
    }
    this.getAllLogs = this.getAllLogs.bind(this)
    this.filter = this.filter.bind(this)
    this.getUsers = this.getUsers.bind(this)
    this.createUserlist = this.createUserlist.bind(this)
    this.changeUser = this.changeUser.bind(this)
    this.changeItem = this.changeItem.bind(this)
    this.createItemlist = this.createItemlist.bind(this)
    this.getItems = this.getItems.bind(this)
    this.changeDate = this.changeDate.bind(this)
    this.clearSearch = this.clearSearch.bind(this)
    this.handlePageClick = this.handlePageClick.bind(this)

    this.getAllLogs()
    this.getUsers()
    this.getItems()
  }

  getUsers(){
    var thisObj = this
    $.getJSON("/api/users.json", function(data){
      thisObj.setState({users: data})
      thisObj.createUserlist(data)
    });
  }

  getItems(){
    var thisObj = this;
    var params = {
      all: true
    };
    $.getJSON("/api/items.json", params, function(data){
      thisObj.setState({items: data.results})
      thisObj.createItemlist(data.results)
    });
  }

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
      page: 1,
      itemsPerPage: LOGS_PER_PAGE,
    }
    this.getLogs(params)
  }

  getLogs(params) {
    var thisobj = this;
    $.getJSON("/api/logs.json", params, function(data) {
      thisobj.setState({
        logs: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    })
  }

  changeUser(event){
    this.setState({currentuser: event, page: 1}, () => {this.filter();})
  }

  changeItem(event){
    this.setState({currentitem: event, page: 1}, () => {this.filter();})
  }

  changeDate(event, picker){
    this.setState({
      currentstartdate: picker.startDate.toString(),
      currentenddate: picker.endDate.toString(),
      page: 1
    }, () => {this.filter();})
  }

  clearSearch(event){
    this.setState({
      currentenddate: null,
      currentstartdate: null,
      currentuser: null,
      currentitem: null,
      page: 1
    }, () => {this.getAllLogs()})
  }

  filter(){
    var params = {
      user: this.state.currentuser,
      item: this.state.currentitem,
      startDate: this.state.currentstartdate,
      endDate: this.state.currentenddate,
      page: this.state.page,
      itemsPerPage: LOGS_PER_PAGE,
    }
    this.getLogs(params);
  }

  handlePageClick(data) {
    let selected = data.selected;
    let offset = Math.ceil(selected * LOGS_PER_PAGE);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.filter();
    });
  }

  render(){

    return(
      <Grid fluid>

        <Row>
          <Col sm={12}>
            <h3>View Logs</h3>
            <hr />
            <p>
              View all logging history. Logs are searchable by item, user, specific date, or range of dates.
            </p>
            <br />
          </Col>
        </Row>

        <Panel>
        <Row>
          <Col sm={4}>
            <Select ref="userSelect" autofocus options={this.state.userlist} simpleValue clearable={true} placeholder="Select User" name="selected-user" value={this.state.currentuser} onChange={this.changeUser} searchable={true}/>
          </Col>
          <Col sm={4}>
            <Select ref="itemSelect" autofocus options={this.state.itemlist} simpleValue clearable={true} placeholder="Select Item" name="selected-item" value={this.state.currentitem} onChange={this.changeItem} searchable={true}/>
          </Col>
          <Col sm={2}>
              <DateRangePicker showDropdowns onApply={this.changeDate}><Button bsStyle="info">Pick Date</Button></DateRangePicker>
          </Col>
          <Col sm={2}>
            <Button onClick={this.clearSearch} bsStyle="danger">Clear</Button>
          </Col>
        </Row>

        <hr />

        <Row>
          <Col sm={12}>
            <LogEntryContainer className="log-list" logs={this.state.logs} />
            <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
          </Col>
        </Row>
        </Panel>
      </Grid>
    )
  }

}

export default LogsContainer
