import React, { Component } from 'react'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import $ from "jquery"
import Paginator from '../../Paginator'
import { ajax, getJSON } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

const STATUS = ["All", "O", "A", "D"];

const ManagerRequestsContainer = React.createClass({

  getInitialState() {
    return {
      "activeKey": 0,
      "requests": [],
      "page": 1,
      "pageCount": 1
    }
  },

  componentWillMount() {
    this.getRequests();
  },

  getRequests() {
    var params = {
      page: 1,
    };
    var url = "/api/requests/all/";
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results,
        pageCount: Math.ceil(data.num_pages),
      })
    })
  },

  handleSelect(selectedKey) {
    this.setState({
      activeKey: selectedKey
    })
  },

  getStatusLabel(status) {
    if (status == "A") {
      return (<Label bsStyle='success'>Approved</Label>)
    } else if (status == "D") {
      return (<Label bsStyle='danger'>Denied</Label>)
    } else if (status == "O") {
      return (<Label bsStyle='warning'>Outstanding</Label>)
    }
    else {
      return null
    }
  },

  getRequestView() {
    var stat = STATUS[this.state.activeKey]
    var requests = []
    if (stat == "All") {
      requests = this.state.requests
    } else if (stat == "O") {
      requests = this.state.requests.filter( (request) => {return request.status == "O"})
    } else if (stat == "A") {
      requests = this.state.requests.filter( (request) => {return request.status == "A"})
    } else if (stat == "D") {
      requests = this.state.requests.filter( (request) => {return request.status == "D"})
    } else {
      requests = []
    }

    return (
      <Row>
        <Col sm={12}>
          <Table condensed hover >
            <thead>
              <tr>
                <th style={{width: "15%"}} className="text-left">Requester</th>
                <th style={{width: "25%"}} className="text-left">Date Open</th>
                <th style={{width: "40%"}} className="text-center">Comment</th>
                <th style={{width: "10%"}} className="text-center">Status</th>
                <th style={{width: "10%"}} className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map( (request, i) => {
                var d = new Date(request.date_open)
                return (
                  <tr key={request.request_id} style={{height: '50px'}}>
                    <td data-th="Requester" style={{width: "20%"}} className="text-left">{request.requester}</td>
                    <td data-th="Date Open" style={{width: "20%"}} className="text-left">{d.toLocaleString()}</td>
                    <td data-th="Comment" style={{width: "40%"}} className="text-left"><div style={{maxHeight: '100px', overflow: 'auto'}}>{request.open_comment}</div></td>
                    <td data-th="Status" style={{width: "10%"}} className="text-center">{this.getStatusLabel(request.status)}</td>
                    <td data-th="Action" style={{width: "10%"}} className="text-center">
                        <Button bsSize="small" bsStyle="info" onClick={e => this.viewRequest(request)}>View</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Col>
      </Row>
    )
  },

  viewRequest(request) {
    browserHistory.push("/app/requests/" + request.request_id);
  },

  render() {
    return (
      <Grid fluid>

        <Row>
          <Col sm={12}>
            <h3>Requests</h3>
            <hr />
            <p>
              View, respond to, and manage inventory requests.
            </p>
            <br />
          </Col>
        </Row>


        <Row>
          <Col sm={12}>
            <Nav bsStyle="pills" justified activeKey={this.state.activeKey} onSelect={this.handleSelect}>
              <NavItem eventKey={0} title="all">All</NavItem>
              <NavItem eventKey={1} title="outstanding">Outstanding</NavItem>
              <NavItem eventKey={2} title="approved">Approved</NavItem>
              <NavItem eventKey={3} title="denied">Denied</NavItem>
            </Nav>
          </Col>
        </Row>

        <hr />

        <Row>
          <Col sm={12}>
            { this.getRequestView() }
          </Col>
        </Row>

      </Grid>
    )
  }

})


export default ManagerRequestsContainer
