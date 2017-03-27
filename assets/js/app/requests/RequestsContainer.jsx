import React, { Component } from 'react'
import { Grid, Row, Col, Button, Nav, NavItem, Table, Panel, Label, Well, Pagination, ControlLabel, FormGroup, FormControl } from 'react-bootstrap'
import { browserHistory } from 'react-router'
import $ from "jquery"
import Paginator from '../Paginator'
import { ajax, getJSON } from 'jquery'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import Select from 'react-select'


const REQUESTS_PER_PAGE = 10;

const STATUS = ["All", "O", "A", "D"];

const RequestsContainer = React.createClass({

  getInitialState() {
    return {
      requests: [],
      page: 1,
      pageCount: 0,
      status: "",
      showSuccessMessage: false,
      successMessage: "",
      showErrorMessage: false,
      errorMessage: ""
    }
  },

  componentWillMount() {
    this.getRequests();
  },

  getRequests() {
    var params = {
      page: this.state.page,
      itemsPerPage: REQUESTS_PER_PAGE,
      status: this.state.status,
    };
    var url = "/api/requests/";
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results,
        pageCount: Math.ceil(data.num_pages),
      })
    })
  },

  handlePageSelect(activeKey) {
    this.setState({page: activeKey}, () => {
      this.getRequests();
    });
  },

  deleteRequest(request) {
    var _this = this
    ajax({
      url:"/api/requests/" + request.request_id + "/",
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.getRequests();
        _this.setState({
          showSuccessMessage: true,
          successMessage: "Successfully deleted outstanding request."
        });
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
        alert("error doing something");
      }
    });
  },

  viewRequest(request) {
    browserHistory.push("/app/requests/" + request.request_id);
  },

  handleStatusSelect(status) {
    if (status == null) {
      this.setState({
        status: ""
      }, this.getRequests)
    } else {
      this.setState({
        status: status.value
      }, this.getRequests)
    }
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

    return (

      <div className="panel panel-default">

        <div className="panel-heading">
          <Row>
            <Col xs={12}>
              <span style={{fontSize:"15px"}} className="panel-title">View Your Requests</span>
            </Col>
          </Row>
        </div>

        <div className="panel-body" style={{minHeight: "480px", maxHeight: "500px"}}>
          <Table condensed hover style={{marginBottom:"0px"}}>
            <thead>
              <tr>
                <th style={{width: " 5%"}} className="text-center">ID</th>
                <th style={{width: "15%"}} className="text-left">Requester</th>
                <th style={{width: "20%"}} className="text-left">Date Open</th>
                <th style={{width: "25%"}} className="text-left">Comment</th>
                <th style={{width: "15%"}} className="text-center">Status</th>
                <th style={{width: "10%"}} className="text-center"></th>
                <th style={{width: "10%"}} className="text-center"></th>
              </tr>
              <tr>
                <th colSpan={6}>
                  <hr style={{margin: "auto"}} />
                </th>
              </tr>
            </thead>
            <tbody>
              {this.state.requests.map( (request, i) => {
                var d = new Date(request.date_open)
                return (
                  <tr key={request.request_id} style={{height: "41px"}}>
                    <td data-th="ID" className="text-center">{request.request_id}</td>
                    <td data-th="Requester" className="text-left">{request.requester}</td>
                    <td data-th="Date Open" className="text-left">{d.toLocaleString()}</td>
                    <td data-th="Comment" className="text-left">
                      <div style={{maxHeight: '100px', overflow: 'auto'}}>
                        {request.open_comment}
                      </div>
                    </td>
                    <td data-th="Status" className="text-center">{this.getStatusLabel(request.status)}</td>
                    <td className="text-center" style={{fontSize:"12px"}}>
                      <Button block bsSize="small" bsStyle="info" onClick={e => this.viewRequest(request)}>View</Button>
                    </td>
                    <td className="text-center" style={{fontSize:"12px"}}>
                      <Button block bsSize="small" bsStyle="danger" onClick={e => this.deleteRequest(request)} disabled={request.status != 'O'}>Cancel</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>

        <div className="panel-footer">
          <Row>
            <Col md={12}>
              <Pagination next prev maxButtons={10} boundaryLinks ellipsis style={{float:"right", margin: "0px"}} bsSize="small" items={this.state.pageCount} activePage={this.state.page} onSelect={this.handlePageSelect} />
            </Col>
          </Row>
        </div>

      </div>
    )
  },

  getRequestFilterPanel() {
    return (
      <Panel header={<span style={{fontSize:"15px"}}>Refine Results</span>}>
        <Row>
          <Col sm={12}>
            <FormGroup bsSize="small">
              <ControlLabel>
                Filter by Request Status
              </ControlLabel>
              <Select style={{fontSize:"12px"}}
                      name="request-status-filter"
                      multi={false}
                      placeholder="Request Status"
                      value={this.state.status}
                      options={[
                        {
                          label: "Outstanding",
                          value: "O",
                        },
                        {
                          label: "Approved",
                          value: "A"
                        },
                        {
                          label: "Denied",
                          value: "D"
                        }
                      ]}
                      onChange={this.handleStatusSelect} />
            </FormGroup>
          </Col>
        </Row>
      </Panel>
    )
  },

  getSuccessMessage() {
    return this.state.showSuccessMessage ? (
      <Row>
        <Col sm={12}>
          <Well bsSize="small">{this.state.successMessage}</Well>
        </Col>
      </Row>
    ) : null
  },

  render() {
    return (
      <Grid>

        <Row>
          <Col sm={12}>
            <Row>
              <Col sm={12}>
                <h3>Your Requests</h3>
                <hr />
              </Col>
            </Row>

            { this.getSuccessMessage() }

            <Row>
              <Col sm={3}>
                { this.getRequestFilterPanel() }
              </Col>

              <Col sm={9}>
                { this.getRequestView() }
              </Col>
            </Row>

          </Col>
        </Row>
      </Grid>
    )
  }

})


export default RequestsContainer
