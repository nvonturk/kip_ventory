import React, {Component} from 'react'
import Checkbox from './Checkbox'
import { ListGroup, ListGroupItem, Label, Row, Col, Grid, Panel, Well, Button } from 'react-bootstrap'
import $ from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'


class EmailSubscriptionContainer extends Component {
  constructor(props) {
    super(props);
    this.user = this.props.route.admin;
    this.state = {
      
    }
    this.handleSubcriptionChange = this.handleSubcriptionChange.bind(this);
   
  }

  handleSubcriptionChange(isSubcribed, label) {
    console.log(isSubcribed);
    this.user.profile.subscribed = isSubcribed;
    console.log(this.user);
    var _this = this;
    $.ajax({
      url:"/api/users/edit/" + this.user.username + "/",
      type: "PUT",
      contentType:"application/json; charset=utf-8",
      processData: false,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: JSON.stringify(this.user),
      traditional: true,
      success:function(response){
        console.log("success");
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        //todo show error message
        console.log("error");
      }
    });

  }

  render(){

    return(
      <Grid fluid>
        <Row>
          <Col xs={12}>
            <h3>Emails</h3>
            <hr />
            <p>
              Configure and schedule emails.
            </p>
            <br />
          </Col>
        </Row>

        <Panel>
          <Row>
            <Col xs={12}>
              <Checkbox startChecked={this.user.profile.subscribed} label={"Subscribed?"} handleCheckboxChange={this.handleSubcriptionChange}/>
            </Col>
          </Row>
          <hr />
          <Row>
            <Col xs={12}>
              TODO: add an email reminder here
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              TODO: put list of Email Reminder Dates here
            </Col>
          </Row>
        </Panel>
      </Grid>
    )
  }

}

export default EmailSubscriptionContainer
