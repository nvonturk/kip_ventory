import React, { Component } from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'
import { getJSON, ajax, serialize } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import TagMultiSelect from '../../TagMultiSelect'

class LocalUserCreationForm extends Component {
  constructor(props) {
    super(props); 
    this.state = {
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      message: '',
    };

    this.onChange = this.onChange.bind(this);
    this.createUser = this.createUser.bind(this);
  }

  getTextField(field_name, presentation_name, type) {
    return (
      <FormGroup bsSize="small">
        <Col componentClass={ControlLabel} sm={2}>
          {presentation_name}
        </Col>
        <Col sm={9}>
          <FormControl type={type} value={this.state[field_name]} name={field_name} onChange={this.onChange} />
        </Col>
      </FormGroup>
    )
  }

  getShortTextField(field_name, presentation_name) {
    return this.getTextField(field_name, presentation_name, "text");
  }

  getPasswordField(field_name, presentation_name) {
    return this.getTextField(field_name, presentation_name, "password");
  }

  getEmailField(field_name, presentation_name) {
    return this.getTextField(field_name, presentation_name, "email");
  }

  showSuccess(message) {
    this.setState({
      message: message,
    })
  }

  clearForm() {
    this.setState({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',    
    })
  }

  showError(errorMsg) {
    this.setState({
      message:errorMsg
    });
  }

  getMessageDiv() {
    return (
      <h5> {this.state.message} </h5>
    )
  }

  createUser() {
    var _this = this;
    ajax({
      url:"/api/users/create/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: _this.state,
      success:function(response){
        var message = "User " + _this.state.username + " created successfully!";
        _this.showSuccess(message);
        _this.clearForm();
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        //todo multiple error message views
        var errors = xhr.responseJSON;
        if (errors['username']) {
          _this.showError(errors['username'][0])
        } else if (errors['email']) {
          _this.showError(errors['email'][0])
        } else {
          _this.showError('Error creating user.')
        }
      }
    });
  }

  onChange(e) {
    e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render() {
    return (
      <Grid fluid>
        <Col xs={8} xsOffset={1}>
          <Form horizontal>
            <Panel>
              <h4>Create a Local User</h4>
              <hr />
              { this.getMessageDiv()}
              { this.getShortTextField("username", "Username") }
              { this.getPasswordField("password", "Password") }
              { this.getShortTextField("first_name", "First Name") }
              { this.getShortTextField("last_name", "Last Name") }
              { this.getEmailField("email", "Email") }
              <FormGroup>
                <Col smOffset={2} sm={2}>
                  <Button bsSize="small" type="button" bsStyle="info" onClick={this.createUser}>
                    Create
                  </Button>
                </Col>
              </FormGroup>
            </Panel>
          </Form>
        </Col>
      </Grid>
    )
  }
}

export default LocalUserCreationForm
