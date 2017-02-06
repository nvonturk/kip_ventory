import React from 'react'
import { Row, Col, Button } from 'react-bootstrap'
import AdminRequestItem from './adminrequestitem'
import $ from 'jquery'

const AdminRequestsContainer = React.createClass({

  getInitialState(){
    return ({allrequests: []})
  },

  getUserRequests(){
    var thisObj = this
    $.getJSON("/api/requests/all.json", function(data){
      thisObj.setState({allrequests: data})
    });
  },

  componentWillMount(){
    this.getUserRequests()
  },



  render() {
    // Need to return in a window all of the requests

    return (
      <Row>
            <Col xs={10} xsOffset={1}>
            {this.state.allrequests.map(function(request, i) {
              return (
                <Row key = {i}>
                  <AdminRequestItem  request={request}/>
                </Row>
              )})}
            </Col>
      </Row>)
  }
})

export default AdminRequestsContainer
