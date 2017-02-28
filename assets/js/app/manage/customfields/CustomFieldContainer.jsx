import React from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button, Checkbox, Table, Modal, Well } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

const FIELD_TYPES = {
  "s": "Short Text",
  "m": "Long Text",
  "i": "Integer",
  "f": "Float",
}

const CustomFieldContainer = React.createClass({

  getInitialState() {
    return {
      existing_fields: [],

      name: "",
      field_type: 's',
      private: false,

      showCreatedSuccess: false,

      fieldToDelete: null,
      showDeleteModal: false,
    }
  },

  componentWillMount() {
    this.getExistingFields();
  },

  getExistingFields() {
    var url = "/api/fields/"
    var _this = this
    getJSON(url, null, function(data) {
      _this.setState({
        existing_fields: data
      })
    })
  },

  onChange(e) {
    e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  createField(e) {
    e.preventDefault()
    var _this = this
    ajax({
      url:"/api/fields/",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        name: _this.state.name,
        field_type: _this.state.field_type,
        private: _this.state.private
      },
      success:function(response){
        _this.getExistingFields();
        _this.setState({
          name: "",
          field_type: 's',
          private: false,
          showCreatedSuccess: true
        })
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


  showDeleteModal(e, field) {
    e.preventDefault()
    this.setState({
      showDeleteModal: true,
      fieldToDelete: field.name,
      showCreatedSuccess: false
    })
  },

  closeDeleteModal() {
    this.setState({
      showDeleteModal: false,
      fieldToDelete: null,
      showCreatedSuccess: false
    })
  },

  deleteField(e) {
    console.log("DPING ")
    e.preventDefault()
    var field = this.state.fieldToDelete;
    const _this = this;
    ajax({
      url:"/api/fields/" + field + "/",
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {},
      success:  function(response){
        _this.getExistingFields();
        _this.closeDeleteModal();
      },
      complete: function(){},
      error:    function (xhr, textStatus, thrownError){
        console.log(xhr)
        console.log(textStatus)
        console.log(thrownError)
        alert("error doing something");
      }
    });
  },

  getSuccessMessage() {
    var ret = this.state.showCreatedSuccess ? (
      <Row>
        <Col sm={12}>
          <Well>Field <span style={{color: "red"}}>{this.state.createdName}</span> successfully created!</Well>
        </Col>
      </Row>) : (null)
    return ret
  },

  render() {
    return (
      <Grid fluid>

        <Row>
          <Col xs={12}>
            <h3>Custom Fields</h3>
            <hr />
            <p>
              Custom fields are administrator-defined fields that will be tracked for all items.
            </p>
            <p>
              Fields marked private are hidden from non-managerial users, and are explicitly for administrative use.
            </p>
            <br />
          </Col>
        </Row>

        { this.getSuccessMessage() }

        <Row>
          <Col xs={12}>
            <Panel>
              <div>
                <h4>Existing custom fields</h4>
                <hr />
              </div>
              <div style={{maxHeight: '300px', overflow:'auto'}}>
                <Table hover condensed >
                  <thead>
                    <tr>
                      <th style={{width:"40%"}} className="text-left">Field Name</th>
                      <th style={{width:"25%"}} className="text-left">Field Type</th>
                      <th style={{width:"25%"}} className="text-center">Private?</th>
                      <th style={{width:"10%"}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    { this.state.existing_fields.map( (field, i) => {
                      return (
                        <tr key={i}>
                          <td data-th="Field Name" className="text-left">{field.name}</td>
                          <td data-th="Field Type" className="text-left">{FIELD_TYPES[field.field_type]}</td>
                          <td data-th="Private?" className="text-center">{field.private ? "Yes" : "No"}</td>
                          <td className="text-center"><Button bsSize="small" bsStyle="danger" onClick={e => this.showDeleteModal(e, field)}>Delete</Button></td>
                        </tr>
                      )
                    } ) }
                  </tbody>
                </Table>
              </div>
            </Panel>
            <br />
          </Col>
        </Row>


        <Modal show={this.state.showDeleteModal} onHide={this.closeDeleteModal}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Field</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this custom field?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button bsSize="small" onClick={this.closeDeleteModal}>Close</Button>
          <Button bsStyle="danger" bsSize="small" onClick={this.deleteField}>Delete</Button>
        </Modal.Footer>
      </Modal>


          <Panel>
            <h4>Create a custom field</h4>
            <hr />

            <Form horizontal onSubmit={this.createField}>
              <FormGroup bsSize="small">
                <Col componentClass={ControlLabel} sm={2}>
                  Field Name
                </Col>
                <Col sm={9}>
                  <FormControl type="text" placeholder="Field name" value={this.state.name} name="name" onChange={this.onChange} />
                </Col>
              </FormGroup>
              <FormGroup bsSize="small">
                <Col componentClass={ControlLabel} sm={2}>
                  Field Type
                </Col>
                <Col sm={6}>
                  <FormControl componentClass="select" name="field_type" value={this.state.field_type} onChange={this.onChange}>
                    <option value="s">Short Text</option>
                    <option value="m">Long Text</option>
                    <option value="i">Integer</option>
                    <option value="f">Float</option>
                  </FormControl>
                </Col>
              </FormGroup>
              <FormGroup bsSize="small">
                <Col componentClass={ControlLabel} sm={2}>
                  Private?
                </Col>
                <Col sm={1}>
                  <Checkbox style={{paddingTop: "6px"}} onChange={e => this.setState({private: e.target.checked})} />
                </Col>
              </FormGroup>
              <FormGroup>
                <Col smOffset={2} sm={2}>
                  <Button bsSize="small" type="submit" bsStyle="info">
                    Create
                  </Button>
                </Col>
              </FormGroup>
            </Form>

          </Panel>

        <Row>
          <br />
          <Col sm={12}>
            <Panel style={{fontSize: '12px'}} header={
              <Row style={{fontSize: '15px'}}>
                <Col sm={3}><strong>Field Type</strong></Col>
                <Col sm={6}><strong>Definition</strong></Col>
                <Col sm={3}><strong>Example</strong></Col>
              </Row>
            }>
            <Row>
              <Col sm={3}><p>Short Text</p></Col>
              <Col sm={6}>Small text fields, single-line only</Col>
              <Col sm={3}>Item name</Col>
            </Row>
            <Row>
              <Col sm={3}><p>Long Text</p></Col>
              <Col sm={6}>Larger, multi-line text fields</Col>
              <Col sm={3}>Item description</Col>
            </Row>
            <Row>
              <Col sm={3}><p>Integer</p></Col>
              <Col sm={6}>Whole numbers only</Col>
              <Col sm={3}>Item quantity</Col>
            </Row>
            <Row>
              <Col sm={3}><p>Float</p></Col>
              <Col sm={6}>Integer or decimal numbers</Col>
              <Col sm={3}>Item price</Col>
            </Row>
            </Panel>
          </Col>
        </Row>

      </Grid>
    )
  }
})

export default CustomFieldContainer
