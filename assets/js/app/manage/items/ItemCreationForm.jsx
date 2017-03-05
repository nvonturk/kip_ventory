import React from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button, Well, Alert } from 'react-bootstrap'
import { getJSON, ajax, serialize } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import TagMultiSelect from '../../TagMultiSelect'


var CUSTOM_FIELDS = []

const ItemCreationForm = React.createClass({
  getInitialState() {
    CUSTOM_FIELDS = []
    return {
      name: "",
      quantity: 0,
      model_no: "",
      description: "",
      tags: [],
      showCreatedSuccess: false,
      showErrorMessage: false,
      errorMessage: ""
    }
  },

  componentWillMount() {
    var url = "/api/fields/"
    var _this = this
    CUSTOM_FIELDS = []
    getJSON(url, null, function(data) {
      CUSTOM_FIELDS = data.map( (field, i) => {return field} )
      data.map( (field, i) => {
        _this.setState({
          [field.name]: ""
        })
      })
    })
  },


  handleTagSelection(tagsSelected) {
    console.log(tagsSelected.split(","))
    this.setState({tags: tagsSelected.split(",")});
  },

  getShortTextField(field_name, presentation_name, is_private) {
    return (
      <FormGroup bsSize="small" key={field_name}>
        <Col componentClass={ControlLabel} sm={2}>
          {presentation_name}
        </Col>
        <Col sm={9}>
          <FormControl type="text" value={this.state[field_name]} name={field_name} onChange={this.onChange} />
        </Col>
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, is_private) {
    return (
      <FormGroup bsSize="small" key={field_name}>
        <Col componentClass={ControlLabel} sm={2}>
          {presentation_name}
        </Col>
        <Col sm={9}>
          <FormControl type="text" style={{resize: "vertical", height:"100px"}} componentClass={"textarea"} value={this.state[field_name]} name={field_name} onChange={this.onChange} />
        </Col>
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, is_private, min, step) {
    return (
      <FormGroup bsSize="small" key={field_name}>
        <Col componentClass={ControlLabel} sm={2}>
          {presentation_name}
        </Col>
        <Col sm={3}>
          <FormControl type="number" min={min} step={step} value={this.state[field_name]} name={field_name} onChange={this.onChange} />
        </Col>
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, handleChange) {
    return (
      <FormGroup bsSize="small" key={field_name}>
        <Col componentClass={ControlLabel} sm={2}>
          {presentation_name}
        </Col>
        <Col sm={3}>
          <FormControl type="number" value={this.state[field_name]} name={field_name} onChange={handleChange} />
        </Col>
      </FormGroup>
    )
  },

  getCustomFields() {
    return CUSTOM_FIELDS.map( (field, i) => {

      var field_name = field.name
      var is_private = field.private
      var field_type = field.field_type

      switch(field_type) {
        case "Single":
          return this.getShortTextField(field_name, field_name, ( e => {this.setState({[custom_fields[field_name]]: e.target.value})} ))
          break;
        case "Multi":
          return this.getLongTextField(field_name, field_name, ( e => {this.setState({[custom_fields[field_name]]: e.target.value})} ))
          break;
        case "Int":
          return this.getIntegerField(field_name, field_name, ( e => {this.setState({[custom_fields[field_name]]: e.target.value})} ))
          break;
        case "Float":
          return this.getFloatField(field_name, field_name, ( e => {this.setState({[custom_fields[field_name]]: e.target.value})} ))
          break
        default:
          return null
      }
    })
  },

  getSuccessMessage() {
    var url = "/app/items/" + this.state.createdName
    var ret = this.state.showCreatedSuccess ? (
      <Row>
        <Col sm={12}>
          <Well bsSize="large">Item <a href={url}>{this.state.createdName}</a> successfully created!</Well>
        </Col>
      </Row>) : (null)
    return ret
  },

  getErrorMessage() {
    return this.state.showErrorMessage ? (
      <Row>
        <Col sm={12}>
          <Alert bsStyle="danger" bsSize="small">{this.state.errorMessage}</Alert>
        </Col>
      </Row>
    ) : null
  },

  createItem() {
    var _this = this;
    var item_name = this.state.name;
    ajax({
      url:"/api/items/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: _this.state,
      traditional: true,
      success:function(response){
        var data = _this.getInitialState()
        console.log(response)
        _this.setState(data)
        for (var i=0; i<CUSTOM_FIELDS.length; i++) {
          _this.setState({
            [CUSTOM_FIELDS[i].name]: ""
          })
        }

        _this.setState({
          showCreatedSuccess: true,
          createdName: item_name,
          showErrorMessage: false,
          errorMessage: ""
        })
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        var response = xhr.responseJSON
        console.log(xhr)
        _this.setState({
          showCreatedSuccess: false,
          createdName: "",
          showErrorMessage: true,
          errorMessage: "Name: " + response.name[0]
        })
      }
    });
  },

  onChange(e) {
    e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  render() {
    return (
      <Grid fluid>

        <Row>
          <Col xs={12}>
            <h3>Item Creation</h3>
            <hr />
            <p>
              Use this form to add new items to the inventory.
            </p>
            <br />
          </Col>
        </Row>

        { this.getSuccessMessage() }
        { this.getErrorMessage() }

        <Row>
          <Col sm={12}>
            <Form horizontal>

              <Panel>
                <h4>Create an item</h4>
                <hr />

                { this.getShortTextField("name", "Name", this.onChange) }
                { this.getShortTextField("model_no", "Model No.", this.onChange) }
                { this.getIntegerField("quantity", "Quantity", this.onChange) }
                { this.getLongTextField("description", "Description", this.onChange) }

                <FormGroup bsSize="small">
                  <Col componentClass={ControlLabel} sm={2}>
                    Tags
                  </Col>
                  <Col sm={9} >
                    <TagMultiSelect tagsSelected={this.state.tags} tagHandler={this.handleTagSelection}/>
                  </Col>
                </FormGroup>

                { this.getCustomFields() }

                <FormGroup bsSize="small">
                  <Col smOffset={2} sm={2}>
                    <Button bsSize="small" type="button" bsStyle="info" onClick={this.createItem}>
                      Submit
                    </Button>
                  </Col>
                </FormGroup>
              </Panel>

            </Form>
          </Col>

        </Row>
      </Grid>
    )
  }
})

export default ItemCreationForm
