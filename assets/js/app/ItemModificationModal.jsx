import React, { Component } from 'react'
import $ from "jquery"
import { getJSON, ajax } from 'jquery'
import { FormGroup, Button, Modal, FormControl, ControlLabel }  from 'react-bootstrap'
import { getCookie } from '../csrf/DjangoCSRFToken'
import TagMultiSelect from './TagMultiSelect'

var CUSTOM_FIELDS = []

class ItemModificationModal extends Component{
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.item.name,
      quantity: this.props.item.quantity,
      model_no: this.props.item.model_no,
      description: this.props.item.description,
      tags: this.props.item.tags,
      // customform: [],
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.getCustomFieldForm = this.getCustomFieldForm.bind(this);
    this.getShortTextField = this.getShortTextField.bind(this);
    this.getLongTextField = this.getLongTextField.bind(this);
    this.getIntegerField = this.getIntegerField.bind(this);
    this.getFloatField = this.getFloatField.bind(this);

  }

  componentWillMount() {
    var url = "/api/items/"+this.state.name+"/fields/"
    var _this = this
    getJSON(url, null, function(data) {
      CUSTOM_FIELDS = data.map( (field, i) => {return field} )
      data.map( (field, i) => {
        _this.setState({
          [field.name]: field.value
        });
      })
      // this.setState({custom})
    })
  }

  getShortTextField(field_name, presentation_name, is_private) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>

        <FormControl type="text" value={this.state[field_name]} name={field_name} onChange={this.handleChange} />
      </FormGroup>
    )
  }

  getLongTextField(field_name, presentation_name, is_private) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>

        <FormControl type="text" style={{resize: "vertical", height:"100px"}} componentClass={"textarea"} value={this.state[field_name]} name={field_name} onChange={this.handleChange} />

      </FormGroup>
    )
  }

  getIntegerField(field_name, presentation_name, is_private, min, step) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>

        <FormControl type="number" min={min} step={step} value={this.state[field_name]} name={field_name} onChange={this.handleChange} />

      </FormGroup>
    )
  }

  getFloatField(field_name, presentation_name, is_private){
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>

        <FormControl type="number" value={this.state[field_name]} name={field_name} onChange={this.handleChange} />

      </FormGroup>
    )
  }

  getCustomFieldForm() {
    var forms = []
    if (CUSTOM_FIELDS.length > 0) {
      forms.push(
        <div key={"custom_fields"}>
          <br />
            <h4>Custom Fields</h4>
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
            break
        }
      }))
      return forms
    }
    return null
  }

  handleChange(name, e) {
    var change = {};
    change[name] = e.target.value;
    this.setState(change);
  }

  handleTagSelection(tagsSelected) {
    this.setState({tags: tagsSelected});
  }

  render(){

    var customform = this.getCustomFieldForm();

    return(
      <div>
        <Modal show={this.props.showModal} onHide={this.props.close}>
          <Modal.Header>
            <Modal.Title>Modify {this.props.item.name}</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <FormGroup controlId="modifyItemForm">
              <ControlLabel>Name</ControlLabel>
              <FormControl
                type="text"
                name="name"
                value={this.state.name ? this.state.name : ""}
                placeholder={this.state.name}
                onChange={this.handleChange.bind(this, 'name')}
              ></FormControl>

              <ControlLabel>Quantity</ControlLabel>
              <FormControl
                type="number"
                name="quantity"
                value={this.state.quantity}
                placeholder={this.state.quantity}
                onChange={this.handleChange.bind(this, 'quantity')}
              ></FormControl>

              <ControlLabel>Model Number</ControlLabel>
              <FormControl
                type="text"
                name="model_no"
                value={this.state.model_no ? this.state.model_no : ""}
                placeholder={this.state.model_no}
                onChange={this.handleChange.bind(this, 'model_no')}
              ></FormControl>

              <ControlLabel>Description</ControlLabel>
              <FormControl
                type="text"
                name="description"
                value={this.state.description ? this.state.description : ""}
                placeholder={this.state.description}
                onChange={this.handleChange.bind(this, 'description')}
              ></FormControl>

              <ControlLabel>Tags</ControlLabel>
              <TagMultiSelect tagsSelected={this.state.tags} tagHandler={this.handleTagSelection}/>

              {customform}

            </FormGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.props.close}>Close</Button>
            <Button onClick={this.props.deleteItem} bsStyle="danger">Delete Item</Button>
            <Button onClick={e => {this.props.saveChanges(this.state.name, this.state.quantity, this.state.model_no, this.state.description, this.state.tags)}} bsStyle="primary">Save Changes</Button>
          </Modal.Footer>
          </Modal>
      </div>
    );
  }
}

export default ItemModificationModal
