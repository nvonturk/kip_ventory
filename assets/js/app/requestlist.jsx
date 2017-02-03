import React, { Component } from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'
import Request from './request'


class RequestList extends Component{
  constructor(props) {
    super(props);
    this.state = {
      requests: [],
    };

  };


  render(){
    var list = [];

    this.props.requests.forEach(function(request){
      list.push(<ListGroupItem><Request request={request}/></ListGroupItem>);
    });

    return(
      <ListGroup>
        {list}
      </ListGroup>
    )
  }

}

export default RequestList
