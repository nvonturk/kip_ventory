import React, { Component } from 'react'
import $ from "jquery"
import RequestSelectFilter from './requestselectfilter'
import RequestList from './requestlist'
import { getCookie } from '../csrf/DjangoCSRFToken'

class UserRequestContainer extends Component {
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
    complete:function(response){      var newrequests = thisobj.state.requests.filter(req => (req.id != request.id))
          console.log("DELETED SUCCESSFULLY")
          console.log(response)
          console.log(newrequests)
          thisobj.setState({
            requests: newrequests
          })
        },
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
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
    $.getJSON("/api/requests.json", function(data){
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

  render() {
    return (
      <div>
        <RequestSelectFilter value={this.state.value} placeholder={this.state.placeholder} options={this.state.options} onChange={this.setFilter} />
        <RequestList deleteRequest={this.deleteRequest} requests={this.state.requests} />
      </div>
    );
  }
}


export default UserRequestContainer
