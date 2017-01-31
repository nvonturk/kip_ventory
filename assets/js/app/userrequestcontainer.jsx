import React, { Component } from 'react'
import $ from "jquery"
import RequestSelectFilter from './requestselectfilter.jsx'



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
    console.log(this.state.selected_type);
  }


  getMyRequests(){
    var thisobj = this;
    $.getJSON("/api/requests.json", function(data){
      thisobj.setRequests(data);
    });
    console.log(this.state.requests);
  }

  handleFilterSelect(selected){

  }




  render() {
    return (
      <div>
      Hello World
        <RequestSelectFilter types={this.state.types} selectHandler={this.setFilter} selected={this.state.selected_type}/>
      </div>
    );
  }
}


export default UserRequestContainer
