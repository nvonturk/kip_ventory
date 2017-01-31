import React, { Component } from 'react'
import $ from "jquery"


class UserRequestContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requests:[],
      types: {
        "oustanding",
        "approved",
        "denied",
        "all",
      },
      filter_type: "all"
    };
    getMyRequests();
  }

  setRequests(requests){
    this.setState({
      requests: requests
    });
  }

  setFilter(type){
    this.setState({
      filter_type : type
    });
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
      </div>
    );
  }
}


export default UserRequestContainer
