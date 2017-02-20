import React, { Component } from 'react'
import { Grid, Row, Col, Button } from 'react-bootstrap'
import $ from "jquery"
import RequestSelectFilter from '../../RequestSelectFilter'
import AdminRequestList from './AdminRequestList'
import Paginator from '../../Paginator'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

const REQUESTS_PER_PAGE = 2;

class AdminRequestsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requests:[],
      page: 1,
      pageCount: 0,
      options: [
                { value: 'O', label: 'Outstanding' },
                { value: 'A', label: 'Approved' },
                { value: 'D', label: 'Denied' },
                { value: 'All', label: 'All' }
            ],
      value: "All",
      placeholder: "Request Types"
    };
    this.setFilter = this.setFilter.bind(this);
    this.deleteRequest = this.deleteRequest.bind(this);
    this.submitRequest = this.submitRequest.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);

    this.getMyRequests();
  }

  getMyRequests(){
    var params = {
      status: this.state.value,
      page: this.state.page, 
      itemsPerPage: REQUESTS_PER_PAGE
    }
    var thisobj = this;
    $.getJSON("/api/requests/all/", params, function(data){
      thisobj.setState({
        requests: data.results,
        pageCount: data.num_pages
      });
    });
  }

  setFilter(type){
    this.setState({
      value : type.value,
      page: 1
    }, this.getMyRequests);
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
          if(request.status == "A"){
            console.log("resulting_request");
            console.log(request);

            thisobj.modifyItem(request);
          }
        },
        complete: function(result){},
        error:function (xhr, textStatus, thrownError){
            alert("Error submitting request.");
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
          alert("Error modifying item.");

      }
    });
  }

  deleteRequest(request){
    var thisobj = this;
    $.ajax({
      url:"/api/requests/" + request.id,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success: function(response){},
      complete: function() {      
        var newrequests = thisobj.state.requests.filter(req => (req.id != request.id));
        thisobj.setState({
          requests: newrequests
        })
      },
      error:function (xhr, textStatus, thrownError){
        alert("Error deleting request.");
      }
    });
  }

  handlePageClick(data) {
    let selected = data.selected;
    let offset = Math.ceil(selected * REQUESTS_PER_PAGE);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.getMyRequests();
    });
  }

  render() {
    return (
      <Grid fluid>
        <RequestSelectFilter value={this.state.value} placeholder={this.state.placeholder} options={this.state.options} onChange={this.setFilter} />
        <AdminRequestList deleteRequest={this.deleteRequest} submit={this.submitRequest} requests={this.state.requests} />
        <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
      </Grid>
    );
  }
}


export default AdminRequestsContainer
