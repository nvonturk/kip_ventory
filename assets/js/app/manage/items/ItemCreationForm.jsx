import React from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import TagMultiSelect from '../../TagMultiSelect'


var CUSTOM_FIELDS = []

const ItemCreationForm = React.createClass({
  getInitialState() {
    return {
      name: "",
      quantity: 0,
      model_no: "",
      description: "",
      tags: [],
      showCreatedSuccess: false
    }


  },

  componentWillMount() {
    var url = "/api/fields/"
    var _this = this
    getJSON(url, null, function(data) {
      CUSTOM_FIELDS = data.map( (field, i) => {return field} )
      data.map( (field, i) => {
        _this.setState({
          [field.name]: field.value
        })
      })
    })
  },

  handleTagSelection(tagsSelected) {
    this.setState({tags: tagsSelected});
  },

  getShortTextField(field_name, presentation_name, is_private) {
    return (
      <FormGroup bsSize="small">
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
      <FormGroup bsSize="small">
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
      <FormGroup bsSize="small">
        <Col componentClass={ControlLabel} sm={2}>
          {presentation_name}
        </Col>
        <Col sm={3}>
          <FormControl type="number" min={min} step={step} value={this.state[field_name]} name={field_name} onChange={this.onChange} />
        </Col>
      </FormGroup>
    )
  },

  getCustomFieldForm() {
    var forms = []
    if (CUSTOM_FIELDS.length > 0) {
      forms.push(
        <div>
          <br />
            <h4>Define Custom Fields</h4>
          <hr />
        </div>
      )
      forms.push(CUSTOM_FIELDS.map( (field, i) => {

        var field_name = field.name
        var is_private = field.private
        var field_type = field.field_type

        switch(field_type) {
          case "s":
            return this.getShortTextField(field_name, field_name, is_private)
            break;
          case "m":
            return this.getLongTextField(field_name, field_name, is_private)
            break;
          case "i":
            return this.getIntegerField(field_name, field_name, is_private)
            break;
          case "f":
            return this.getFloatField(field_name, field_name, is_private)
            break
          default:
            return null
        }
      }))
      return forms
    }
    return null
  },

  createItem() {
    var _this = this;
    ajax({
      url:"/api/items/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: this.state,
      success:function(response){
        console.log(response)
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
        alert("error doing something");
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
        <Col xs={8} xsOffset={1}>

          <Form horizontal>

            <Panel>
              <h4>Create an Item</h4>
              <hr />

              { this.getShortTextField("name", "Name", false) }
              { this.getShortTextField("model_no", "Model No.", false) }
              { this.getIntegerField("quantity", "Quantity", false) }
              { this.getLongTextField("description", "Description", false) }

              <TagMultiSelect tagsSelected={this.state.tags} tagHandler={this.handleTagSelection}/>


              { this.getCustomFieldForm() }

              <FormGroup>
                <Col smOffset={2} sm={2}>
                  <Button bsSize="small" type="button" bsStyle="info" onClick={this.createItem}>
                    Submit
                  </Button>
                </Col>
              </FormGroup>
            </Panel>

          </Form>

        </Col>
      </Grid>
    )
  }
})

export default ItemCreationForm
