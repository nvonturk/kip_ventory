import React, { Component } from 'react'
import { ListGroup, ListGroupItem, Label } from 'react-bootstrap'



class RequestList extends Component{
  constructor(props) {
    super(props);

  };

  render(){
    var list = [];

    this.props.requests.forEach(function(request){
      var label = null;
      if(request.item.status=="Outstanding") {
        label = <Label bsStyle="warning">Outstanding</Label>

      }
      if(request.item.status=="Approved") {
        label = <Label bsStyle="success">Outstanding</Label>

      }
      if(request.item.status=="Denied") {
        label = <Label bsStyle="danger">Outstanding</Label>
      }
      if(label == null){
        console.log("Label equals null for " + request.status);
      }
      list.push(<ListGroupItem>{request.item.name} {request.status} {label}</ListGroupItem>)
    });
    return(
      <ListGroup>
        {list}
      </ListGroup>
    )
  }

}

export default RequestList
