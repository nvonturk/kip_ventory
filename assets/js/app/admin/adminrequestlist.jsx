import React, { Component } from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import Request from '../request'
import AdminRequest from './adminrequest'
import SimpleRequest from '../simplerequest'


class AdminRequestList extends Component{
  constructor(props) {
    super(props);
    this.state = {
      requests: [],
    };

  };


  render(){
    var list = [];
    var thisObj = this;

    if(this.props.simple) {
      this.props.requests.map(function(request, i){
        list.push(<ListGroupItem key={i}><SimpleRequest deleteRequest={thisObj.props.deleteRequest} request={request}/></ListGroupItem>);
      });
    } else {
      this.props.requests.map(function(request, i){
        list.push(<ListGroupItem key={i}><AdminRequest deleteRequest={thisObj.props.deleteRequest} submit={thisObj.props.submit} request={request}/></ListGroupItem>);
      });
    }

    return(
      <ListGroup>
        {list}
      </ListGroup>
    )
  }

}

export default AdminRequestList
