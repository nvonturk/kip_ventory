import React, { Component } from 'react'
import $ from "jquery"
import RequestSelectFilter from './requestselectfilter'
import RequestList from './requestlist'



class UserRequestContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requests:[],
      types: [
        "All",
        "Oustanding",
        "Approved",
        "Denied",
      ],
      selected_type: "Outstanding"
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

  setFilter(type){
    this.setState({
      selected_type : type
    });
  }


  getMyRequests(){
    var thisobj = this;
    $.getJSON("/api/requests.json", function(data){
      thisobj.setRequests(data);
    });
  }

  handleFilterSelect(selected){

  }




  render() {
    return (
      <div>
      Hello World
        <RequestSelectFilter types={this.state.types} selectHandler={this.setFilter} />
        <RequestList requests={this.state.requests} selected_type={this.state.selected_type}/>
      </div>
    );
  }
}


export default UserRequestContainer
