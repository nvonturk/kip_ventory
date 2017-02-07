import React, { Component } from 'react'
import { Grid, Row, Col, Button } from 'react-bootstrap'
import $ from "jquery"
import RequestSelectFilter from '../../RequestSelectFilter'
import AdminRequestList from './AdminRequestList'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class AdminRequestsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requests:[],
      all_requests:[],
      options: [
                { value: 'O', label: 'Outstanding' },
                { value: 'A', label: 'Approved' },
                { value: 'D', label: 'Denied' },
                { value: 'all', label: 'All' }
            ],
      value: "all",
      placeholder: "Request Types"
    };
    this.setRequests = this.setRequests.bind(this);
    this.setFilter = this.setFilter.bind(this);
    this.deleteRequest = this.deleteRequest.bind(this);
    this.submitRequest = this.submitRequest.bind(this);



    this.getMyRequests();
  }

  setRequests(requests){
    this.setState({
      requests: requests
    });
  }

  setAllRequests(requests){
    this.setState({
      all_requests: requests
    });
  }

  deleteRequest(request){
    var thisobj = this
    $.ajax({
    url:"/api/requests/" + request.id,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    },
    success:function(response){},
    complete:function(){      var newrequests = thisobj.state.requests.filter(req => (req.id != request.id))
          thisobj.setState({
            requests: newrequests
          })
        },
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");
    }
    });

  }

  setFilter(type){
    this.setState({
      value : type.value,
      requests: this.filterRequests(type.value)
    });
  }


  getMyRequests(){
    var thisobj = this;
    $.getJSON("/api/requests/all.json", function(data){
      thisobj.setAllRequests(data);
      thisobj.setRequests(data);
    });
  }

  filterRequests(option){
    var new_reqs;
    if(option == "all"){
        new_reqs = this.state.all_requests.slice();
    } else{
        new_reqs = this.state.all_requests.filter(function(request){
          return option == request.status;
        });
    }
    return new_reqs;
  }

  submitRequest(e, request, decision, quantity, comment){
    e.preventDefault();

    request.closed_comment = comment;
    request.quantity = quantity;
    request.administrator = this.props.route.admin
    request.date_closed = (new Date()).toISOString()
    request.status = (decision == "approved") ? "A" : "D"

    if(request.item.quantity < request.quantity && request.status == "A"){
      //THROW SOME ERROR OR INDICATION TO USER HERE, ASK BRODY, maybe do on backend as well
      alert("Error - attempted to disburse too many instances.");
    } else{
      //make apache call to put

      var thisobj = this;
      $.ajax({
      url:"/api/requests/" + request.id,
      type: "PUT",
      data: {
        item: request.item.id,
        requester: request.requester.id,
        quantity: request.quantity,
        date_open: request.date_open,
        open_reason: request.open_reason,
        date_closed: request.date_closed,
        closed_comment: request.closed_comment,
        administrator: request.administrator.id,
        status: request.status,
      },
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success: function(result){
        thisobj.getMyRequests();
        //TODO: Going to have to change this to make it fail gracefully
        var resulting_request = JSON.parse(result.responseText);
        if(resulting_request.status == "A"){
          thisobj.modifyItem(request);
        }
      },
      complete: function(result){},
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");
      }

    });
  }
}

modifyItem(request){
  var item = request.item;
  var thisobj = this;
  var new_quantity = item.quantity - request.quantity;
  $.ajax({
  url:"/api/items/" + item.id,
  type: "PUT",
  data: {
    name: item.name,
    // photo_src: item.photo_src,
    location: item.location,
    model: item.model,
    quantity: new_quantity,
    description: item.description,
    tags: item.tags,
  },
  beforeSend: function(request) {
    request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
  },
  sucess: function(result){

  },
  complete: function(result){

  },
  error:function (xhr, textStatus, thrownError){
      alert("error doing something");

  }
});
}


  render() {
    return (
      <Grid fluid>
        <RequestSelectFilter value={this.state.value} placeholder={this.state.placeholder} options={this.state.options} onChange={this.setFilter} />
        <AdminRequestList deleteRequest={this.deleteRequest} submit={this.submitRequest} requests={this.state.requests} />
      </Grid>
    );
  }
}


export default AdminRequestsContainer
