import React, { Component } from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import Request from './request'
import SimpleRequest from './simplerequest'


class RequestList extends Component{
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
        list.push(<ListGroupItem key={i}><Request deleteRequest={thisObj.props.deleteRequest} request={request}/></ListGroupItem>);
      });
    }

    return(
      <ListGroup>
        {list}
      </ListGroup>
    )
  }

}

export default RequestList
