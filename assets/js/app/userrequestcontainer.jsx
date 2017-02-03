import React, { Component } from 'react'
import $ from "jquery"
import RequestSelectFilter from './requestselectfilter'
import RequestList from './requestlist'



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

  setFilter(type){
    console.log(type);
    this.setState({
      value : type.value,
      requests: this.filterRequests(type.value)
    });
    // this.filterRequests(this.state.value);
  }


  getMyRequests(){
    var thisobj = this;
    $.getJSON("/api/requests.json", function(data){
      thisobj.setAllRequests(data);
      thisobj.setRequests(data);
    });
  }

  filterRequests(option){
    if(option == "all"){
        var new_reqs = this.state.all_requests.slice();
    } else{
        var new_reqs = this.state.all_requests.filter(function(request){
          return option == request.status;
        });
        return new_reqs;
    }
  }

  render() {
    return (
      <div>
      Hello World
        <RequestSelectFilter value={this.state.value} placeholder={this.state.placeholder} options={this.state.options} onChange={this.setFilter} />
        <RequestList requests={this.state.requests} />
      </div>
    );
  }
}


export default UserRequestContainer
