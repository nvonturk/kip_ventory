import React, { Component } from 'react'
import { getJSON, ajax } from "jquery"
import RequestView from './RequestView'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { Grid, Row, Col, PageHeader, PanelGroup, Panel, Alert } from 'react-bootstrap'

class RequestListContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      requests: []
    };
    this.deleteRequest = this.deleteRequest.bind(this);
    this.getMyRequests = this.getMyRequests.bind(this);

    this.getMyRequests();
  }

  deleteRequest(request){
    var thisobj = this
    console.log(request)
    ajax({
      url:"/api/requests/" + request.id.toString(),
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var newrequests = thisobj.state.requests.filter(req => (req.id != request.id))
        thisobj.setState({
          requests: newrequests
        })
        console.log(newrequests)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){}
    });
  }


  getMyRequests(){
    var _this = this;
    getJSON("/api/requests.json", function(data){
      _this.setState({
        requests: data
      })
    });
  }

  getFilteredRequestContent(filt) {
    var requests = this.state.requests.filter(filt)
    var _this = this
    return (
      <PanelGroup accordion>
        {requests.map(function (req, i) {
          return (<RequestView key={i} request={req} deleteFunc={_this.deleteRequest}/>);
        })}
      </PanelGroup>
    )
  }

  render() {
    var _this = this;
    return (
      <Grid>
        <Row>
          <div className="page-header" style={{margin:'25px 0px 25px'}}>
            <h2>Requests</h2>
          </div>
        </Row>
        <Row>
          <Col xs={12} xsOffset={0}>

            <Row>
              <Panel collapsible bsStyle="warning" header={<Grid fluid><Row><Col xs={12}><h5>Outstanding</h5></Col></Row></Grid>}>
                {this.getFilteredRequestContent(req => (req.status == 'O'))}
              </Panel>
            </Row>

            <Row>
              <Panel collapsible bsStyle="success" header={<Grid fluid><Row><Col xs={12}><h5>Approved</h5></Col></Row></Grid>}>
                {this.getFilteredRequestContent(req => (req.status == 'A'))}
              </Panel>
            </Row>

            <Row>
              <Panel collapsible bsStyle="danger" header={<Grid fluid><Row><Col xs={12}><h5>Denied</h5></Col></Row></Grid>}>
                {this.getFilteredRequestContent(req => (req.status == 'D'))}
              </Panel>
            </Row>

          </Col>
        </Row>
      </Grid>
    );
  }
}


export default RequestListContainer
