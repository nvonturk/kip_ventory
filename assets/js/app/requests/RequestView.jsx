import React, { Component } from 'react'
import { getJSON } from "jquery"
import { Grid, Row, Col, Panel, Image, Button } from 'react-bootstrap'
import { Link } from 'react-router'

class RequestContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.callDeleteFunc = this.callDeleteFunc.bind(this);
    this.getCancelButton = this.getCancelButton.bind(this);
    this.getContent = this.getContent.bind(this);
  }

  callDeleteFunc(event) {
    var req = this.props.request
    this.props.deleteFunc(req);
  }

  getCancelButton() {
    var canDelete = (this.props.request.status == 'O')
    return canDelete ? <Button bsStyle="danger" block onClick={this.callDeleteFunc}>Cancel</Button> : null
  }

  getContent() {
    var request = this.props.request
    var requester = request.requester
    var requester_url = "/app/profile/" + requester.id
    var requester_name = requester.first_name + " " + requester.last_name
    var date = new Date(Date.parse(this.props.request.date_open)).toDateString()
    return (
      <Grid fluid>

        <Row className="show-grid">

          <Col md={2}>
            <Image thumbnail src={request.item.photo_src} alt={request.item.name} style={{width: '100px', height:'100px'}}/>
          </Col>

          <Col md={3}>
              <Col md={12}>
                <h6>{request.item.name}</h6>
              </Col>

              <Col md={12}>
                <h6>Requester: <Link to={requester_url}> {requester_name}</Link></h6>
              </Col>

              <Col md={12}>
                <h6>Date: {date}</h6>
              </Col>
          </Col>

          <Col md={5}>
                <h6><strong>Reason</strong></h6>
                <p style={{maxHeight: '70px', overflow: 'auto'}}><small>{request.open_reason}</small></p>
          </Col>

          <Col md={2}>
            <Row>
              <Col xs={12}>
                <Row>
                  <Col xs={10} xsOffset={1} style={{padding: '10px 0px'}}>
                    <Row>
                      <Col xs={8}>
                        <span>Quantity:</span>
                      </Col>
                      <Col xs={4}>
                        <span>{request.quantity}</span>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col xs={10} xsOffset={1} style={{padding: '10px 0px'}}>
                {this.getCancelButton()}
              </Col>
            </Row>
          </Col>

        </Row>
      </Grid>
    )
  }


  render() {
    var req = this.props.request
    var _this = this;
    return (
      <Panel>
        {this.getContent()}
      </Panel>
    );
  }
}


export default RequestContainer
