import React, { Component } from 'react'
import $ from "jquery"
import RequestSelectFilter from './RequestSelectFilter'
import RequestList from './RequestList'
import { getCookie } from '../csrf/DjangoCSRFToken'
import { Grid, Row, Col } from 'react-bootstrap'
import Paginator from '../../Paginator'

const REQUESTS_PER_PAGE = 1;


class UserRequestContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requests:[],
      options: [
                { value: 'O', label: 'Outstanding' },
                { value: 'A', label: 'Approved' },
                { value: 'D', label: 'Denied' },
                { value: 'all', label: 'All' }
            ],
      filter_option: "all",
      placeholder: "Request Types",
      "page": 1,
      "pageCount": 0
    };
    this.filterRequests = this.filterRequests.bind(this);
    this.deleteRequest = this.deleteRequest.bind(this);

    this.getMyRequests();
  }

  deleteRequest(request){
    var thisobj = this
    $.ajax({
    url:"/api/requests/" + request.id,
    type: "DELETE",
    beforeSend: function(request) {
      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    },
    success:function(response){
      var newrequests = thisobj.state.requests.filter(req => (req.id != request.id))
      console.log("DELETED SUCCESSFULLY")
      console.log(newrequests)
      thisobj.setState({
        requests: newrequests
      })
    },
    complete:function(){},
    error:function (xhr, textStatus, thrownError){
        alert("error doing something");
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
    }
    });

  }

  filterRequests(type){
    this.setState({
      filter_option : type.value,
      page: 1,
    }, this.getMyRequests);
  }


  getMyRequests(){
    var params = {
      page: this.state.page,
      itemsPerPage: REQUESTS_PER_PAGE, 
      status: this.state.filter_option
    };
    var url = "/api/requests.json";
    var _this = this;
    $.getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results,
        pageCount: Math.ceil(data.num_pages),
      })
    })
  }

  handlePageClick(data) {
    let selected = data.selected;
    let offset = Math.ceil(selected * LOGS_PER_PAGE);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.getMyRequests();
    });
  }


  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12} xsOffset={0}>
            <RequestSelectFilter value={this.state.filter_option} placeholder={this.state.placeholder} options={this.state.options} onChange={this.filterRequests} />
          </Col>
        </Row>
        <Row>
          <Col xs={12} xsOffset={0}>
            <RequestList deleteRequest={this.deleteRequest} requests={this.state.requests} />
          </Col>

        </Row>
        <Row>
          <Col xs={12} xsOffset={0}>
            <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
          </Col>
        </Row>
      </Grid>
    );
  }
}


export default UserRequestContainer
