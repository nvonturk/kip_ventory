import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, FormGroup, FormControl, ControlLabel, HelpBlock, Panel, Label }  from 'react-bootstrap'
import RequestList from '../RequestList'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from './CreateTransactionsContainer'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../TagMultiSelect'


const ItemDetail = React.createClass({

  getInitialState() {
    return {
      requests: [],
      transactions: [],
      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },
      allowModify: this.props.route.user.is_staff,
      allowDelete: this.props.route.user.is_superuser
    }
  },

  componentWillMount() {
    this.getItem();
    this.getOutstandingRequests();
    this.getTransactions();
  },

  getItem() {
    var url = "/api/items/" + this.props.params.item_name + "/";
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        item: data
      })
    })
  },

  getOutstandingRequests() {
    var url = "/api/requests/";
    var params = {item: this.props.params.item_name, status: "O", all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results
      })
    })
  },

  getTransactions() {
    var url = "/api/transactions/"
    var params = {item: this.props.params.item_name, all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        transactions: data.results
      })
    })
  },

  handleItemFormChange(e) {
    e.preventDefault()
    var item = this.state.item
    item[e.target.name] = e.target.value
    this.setState({
      item: item
    })
  },

  handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    console.log(this.state.item)
    var url = "/api/items/" + this.props.params.item_name + "/"
    var data = this.state.item
    ajax({
      url: url,
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success: function(response) {
        var new_url = "/app/inventory/" + response.name + "/"
        window.location.assign(new_url)
      }
    })
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col sm={12}>
            <Row>
              <Col sm={12}>
                <h3>{this.props.params.item_name}</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col sm={4}>
                <Form onSubmit={this.handleSubmit}>
                  <Row>
                    <Col sm={12} xs={12}>
                      <FormGroup bsSize="small" controlId="name">
                        <ControlLabel>Name<span style={{color:"red"}}>*</span></ControlLabel>
                        <FormControl type="text" name="name" value={this.state.item.name} onChange={this.handleItemFormChange}/>
                      </FormGroup>
                    </Col>
                  </Row>

                  {this.getQuantityAndModelNoForm()}

                  <Row>
                    <Col sm={12} xs={12}>
                      <FormGroup bsSize="small" controlId="description">
                        <ControlLabel>Description</ControlLabel>
                        <FormControl type="text"
                                     style={{resize: "vertical", height:"100px"}}
                                     componentClass={"textarea"}
                                     name="description"
                                     value={this.state.item.description}
                                     onChange={this.handleItemFormChange}/>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row>
                    <Col sm={12} xs={12}>
                      <FormGroup bsSize="small" controlId="tags">
                        <ControlLabel>Tags</ControlLabel>
                        <TagMultiSelect tagsSelected={this.state.item.tags} tagHandler={this.handleTagSelection}/>
                      </FormGroup>
                    </Col>
                  </Row>

                  {this.getCustomFieldForms()}

                  <Row>
                    <Col sm={6} smOffset={0} xs={4} xsOffset={4}>
                      <Button bsStyle="info" type="submit">Save</Button>
                    </Col>
                  </Row>

                </Form>
              </Col>
            </Row>

          </Col>
        </Row>
      </Grid>
    )
  },

  handleTagSelection(tagsSelected) {
    var item = this.state.item
    var tags = tagsSelected.split(",")
    if (tags.length == 1) {
      if (tags[0] == "") {
        tags = []
      }
    }
    item.tags = tags
    this.setState({item: item});
  },

  getQuantityAndModelNoForm() {
    return (this.props.route.user.is_staff) ? (
      <Row>
        <Col sm={8} xs={12}>
          <FormGroup bsSize="small" controlId="model_no">
            <ControlLabel>Model No.</ControlLabel>
            <FormControl type="text" name="model_no" value={this.state.item.model_no} onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
        <Col sm={4} xs={12}>
          <FormGroup bsSize="small" controlId="quantity">
            <ControlLabel>Quantity<span style={{color:"red"}}>*</span></ControlLabel>
            <FormControl name="quantity" type="number" value={this.state.item.quantity} onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
      </Row>
    ) : (
        <Col sm={12} xs={12}>
          <FormGroup bsSize="small" controlId="model_no">
            <ControlLabel>Model No.</ControlLabel>
            <FormControl type="text" name="model_no" value={this.state.item.model_no} onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
    )
  },

  getCustomFieldForms() {
    return this.state.item.custom_fields.map( (field, i) => {

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
      }
    })
  },

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="text"
                     value={this.state.item.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
          <ControlLabel>{presentation_name}</ControlLabel>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="number"
                     min={min}
                     step={step}
                     value={this.state.item.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name} </ControlLabel>
        <FormControl type="number"
                   value={this.state.custom_fields[i].value}
                   name={field_name}
                   onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  handleCustomFieldChange(i, name, e) {
    var item = this.state.item
    item.custom_fields[i].value = e.target.value
    this.setState({
      item: item
    })
  },

})

export default ItemDetail
