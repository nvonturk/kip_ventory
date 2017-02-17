import React, { Component } from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import Request from '../../Request'
import AdminRequest from './AdminRequest'
import SimpleRequest from '../../SimpleRequest'


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
        list.push(<ListGroupItem key={request.id}><SimpleRequest deleteRequest={thisObj.props.deleteRequest} request={request}/></ListGroupItem>);
      });
    } else {
      this.props.requests.map(function(request, i){
        list.push(<ListGroupItem key={request.id}><AdminRequest deleteRequest={thisObj.props.deleteRequest} submit={thisObj.props.submit} request={request}/></ListGroupItem>);
      });
    }

    return(
      <ListGroup>
        {list.map(function(li, i) {
          return li;
        })}
      </ListGroup>
    )
  }

}

export default AdminRequestList
