import React, { Component } from 'react'
import { getJSON, ajax } from 'jquery'
import { FormGroup, Button, Modal, FormControl, ControlLabel }  from 'react-bootstrap'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import TagMultiSelect from '../TagMultiSelect'

// var CUSTOM_FIELDS = []

class ItemModificationModal extends Component{
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.item.name,
      quantity: this.props.item.quantity,
      model_no: this.props.item.model_no,
      description: this.props.item.description,
      tags: this.props.item.tags,
      custom_fields: []
    };

    this.handleItemFieldChange = this.handleItemFieldChange.bind(this);
    this.handleCustomFieldChange = this.handleCustomFieldChange.bind(this)
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.getCustomFieldForms = this.getCustomFieldForms.bind(this);
    this.getShortTextField = this.getShortTextField.bind(this);
    this.getLongTextField = this.getLongTextField.bind(this);
    this.getIntegerField = this.getIntegerField.bind(this);
    this.getFloatField = this.getFloatField.bind(this);
  }

  componentWillMount() {
    var url = "/api/items/" + this.props.item.name + "/fields/"
    var _this = this
    getJSON(url, null, function(data) {
      data.map( (field, i) => {
        var custom_field_entry = {name: field.name, field_type: field.field_type, value: field.value}
        _this.setState({
          custom_fields: _this.state.custom_fields.concat([custom_field_entry])
        })
      })
    })
  }

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>
        <FormControl type="text"
                     value={this.state.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  }

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>
        <FormControl type="text"
                     style={{resize: "vertical", height:"100px"}}
                     componentClass={"textarea"}
                     value={this.state.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  }

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>
        <FormControl type="number"
                     min={min}
                     step={step}
                     value={this.state.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  }

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>
          {presentation_name}
        </ControlLabel>
        <FormControl type="number"
                     value={this.state.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  }

  getCustomFieldForms() {
    return this.state.custom_fields.map( (field, i) => {

      var field_name = field.name
      var is_private = field.private
      var field_type = field.field_type

      switch(field_type) {
        case "Single":
          return this.getShortTextField(field_name, field_name, i)
          break;
        case "Multi":
          return this.getLongTextField(field_name, field_name, i)
          break;
        case "Int":
          return this.getIntegerField(field_name, field_name, 0, 1, i)
          break;
        case "Float":
          return this.getFloatField(field_name, field_name, i)
          break
        default:
          return null
          break
        }
      }
    )
  }

  handleItemFieldChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  handleCustomFieldChange(i, name, e) {
    var custom_fields = this.state.custom_fields
    custom_fields[i].value = e.target.value
    this.setState(
      custom_fields: custom_fields
    )
  }

  handleTagSelection(tagsSelected) {
    this.setState({tags: tagsSelected});
  }

  render(){

    var customforms = this.getCustomFieldForms();

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
                value={this.state.name}
                placeholder={this.state.name}
                onChange={this.handleItemFieldChange}
              />

              {
                this.props.is_admin
                ? <div><ControlLabel>Quantity</ControlLabel>
                  <FormControl
                    type="number"
                    name="quantity"
                    value={this.state.quantity}
                    placeholder={this.state.quantity}
                    onChange={this.handleItemFieldChange}
                  ></FormControl></div> :null
              }

              <ControlLabel>Model Number</ControlLabel>
              <FormControl
                type="text"
                name="model_no"
                value={this.state.model_no ? this.state.model_no : ""}
                placeholder={this.state.model_no}
                onChange={this.handleItemFieldChange}
              ></FormControl>

              <ControlLabel>Description</ControlLabel>
              <FormControl
                type="text"
                name="description"
                value={this.state.description ? this.state.description : ""}
                placeholder={this.state.description}
                onChange={this.handleItemFieldChange}
              ></FormControl>

              <ControlLabel>Tags</ControlLabel>
              <TagMultiSelect tagsSelected={this.state.tags} tagHandler={this.handleTagSelection}/>

              {customforms}

            </FormGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.props.close}>Close</Button>
            {
              this.props.is_admin
                ? <Button onClick={this.props.deleteItem} bsStyle="danger">
                  Delete Item
                  </Button>
                : null
            }
            <Button onClick={e => {this.props.saveChanges(e, this.state)}} bsStyle="primary">Save Changes</Button>
          </Modal.Footer>
          </Modal>
      </div>
    );
  }
}

export default ItemModificationModal
