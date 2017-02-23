import React, { Component } from 'react'
import $ from "jquery"
import { getJSON, ajax } from 'jquery'
import { FormGroup, Button, Modal, FormControl, ControlLabel }  from 'react-bootstrap'
import { getCookie } from '../csrf/DjangoCSRFToken'
import TagMultiSelect from './TagMultiSelect'


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

  }

  // componentWillMount() {
  //   var url = "/api/items/"+this.state.name+"/fields/"
  //   var _this = this
  //   console.log("fuck me");
  //   // getJSON(url, null, function(data) {
  //   //   console.log(data);
  //   //   // CUSTOM_FIELDS = data.map( (field, i) => {return field} )
  //   //   // data.map( (field, i) => {
  //   //   //   _this.setState({
  //   //   //     [field.name]: field.value
  //   //   //   })
  //   //   // })
  //   // })
  // }

  handleChange(name, e) {
    var change = {};
    change[name] = e.target.value;
    this.setState(change);
  }

  handleTagSelection(tagsSelected) {
    this.setState({tags: tagsSelected});
  }

  render(){

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


            </FormGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.props.close}>Close</Button>
            <Button bsStyle="primary">Save Changes</Button>
          </Modal.Footer>
          </Modal>
      </div>
    );
  }
}

export default ItemModificationModal
