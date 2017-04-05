import React from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel,
         Button, Checkbox, Table, Modal, Well, Alert, Glyphicon, Pagination } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

import CustomFieldInfoPanel from './CustomFieldInfoPanel'

const FIELD_TYPES = {
  "Single": "Single-line",
  "Multi": "Multi-line",
  "Int": "Integer",
  "Float": "Float",
}

const CustomFieldList = React.createClass({

  getInitialState() {
    return {
      name: "",
      field_type: 'Single',
      private: false,
      asset_tracked: false,

      existing_fields: [],

      showCreatedSuccess: false,
      showErrorMessage: false,
      errorMessage: "",
      fieldToDelete: null,
      showDeleteModal: false,
      showCreationModal: false,

      page: 1,
      pageCount: 1,
      itemsPerPage: 10,
    }
  },

  componentWillMount() {
    this.getExistingFields();
  },

  getExistingFields() {
    var url = "/api/fields/"
    var _this = this
    var params = {
      itemsPerPage: this.state.itemsPerPage,
      page: this.state.page
    }
    getJSON(url, params, function(data) {
      _this.setState({
        existing_fields: data.results,
        pageCount: data.num_pages
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
      contentType: "application/json",
      type: "POST",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: JSON.stringify({
        name: _this.state.name,
        field_type: _this.state.field_type,
        private: _this.state.private,
        asset_tracked: _this.state.asset_tracked
      }),
      success:function(response){
        _this.getExistingFields();
        _this.setState({
          name: "",
          field_type: 'Single',
          private: false,
          asset_tracked: false,
          showCreatedSuccess: true,
          showErrorMessage: false,
          showCreationModal: false,
        })
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        var response = xhr.responseJSON
        _this.setState({
          showCreationModal: false,
          showCreatedSuccess: false,
          showErrorMessage: true,
          errorMessage: response.name[0]
        });
      }
    });
  },


  showDeleteModal(e, field) {
    e.preventDefault()
    this.setState({
      showDeleteModal: true,
      fieldToDelete: field.name,
      showCreatedSuccess: false,
      showErrorMessage: false
    })
  },

  closeDeleteModal() {
    this.setState({
      showDeleteModal: false,
      fieldToDelete: null,
      showCreatedSuccess: false,
      showErrorMessage: false
    })
  },

  showCreationModal(e, field) {
    e.preventDefault()
    this.setState({
      showCreationModal: true,
      name: "",
      field_type: 'Single',
      private: false,
      asset_tracked: false
    })
  },

  closeCreationModal() {
    this.setState({
      showCreationModal: false,
      name: "",
      field_type: 'Single',
      private: false,
      asset_tracked: false
    })
  },

  deleteField(e) {
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
        var response = xhr.responseJSON
        console.log(response)
        _this.setState({
          showCreatedSuccess: false,
          showErrorMessage: true,
          errorMessage: "Deletion failed."
        });
      }
    });
  },

  getCustomFieldCreationForm() {
    return (
      <Form horizontal onSubmit={this.createField}>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} sm={3}>
            Field Name
          </Col>
          <Col sm={6}>
            <FormControl type="text" placeholder="Field name" value={this.state.name} name="name" onChange={this.onChange} />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} sm={3}>
            Field Type
          </Col>
          <Col sm={6}>
            <FormControl componentClass="select" name="field_type" value={this.state.field_type} onChange={this.onChange}>
              <option value="Single">Single-line text</option>
              <option value="Multi">Multi-line text</option>
              <option value="Int">Integer</option>
              <option value="Float">Float</option>
            </FormControl>
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} sm={3}>
            Private?
          </Col>
          <Col sm={1}>
            <Checkbox style={{paddingTop: "6px"}} onChange={e => this.setState({private: e.target.checked})} />
          </Col>
        </FormGroup>
        <FormGroup bsSize="small">
          <Col componentClass={ControlLabel} sm={3}>
            Asset-Tracked?
          </Col>
          <Col sm={1}>
            <Checkbox style={{paddingTop: "6px"}} onChange={e => this.setState({asset_tracked: e.target.checked})} />
          </Col>
        </FormGroup>
      </Form>
    )
  },

  getSuccessMessage() {
    var ret = this.state.showCreatedSuccess ? (
      <Row>
        <Col sm={12}>
          <Alert bsSize="small" bsStyle="success">Field <span style={{color: "red"}}>{this.state.createdName}</span> successfully created!</Alert>
        </Col>
      </Row>) : (null)
    return ret
  },

  getErrorMessage() {
    var ret = this.state.showErrorMessage ? (
      <Row>
        <Col sm={12}>
          <Alert bsSize="small" bsStyle="danger">{this.state.errorMessage}</Alert>
        </Col>
      </Row>) : (null)
    return ret
  },

  handlePageSelect(activeKey) {
    this.setState({page: activeKey}, this.getExistingFields)
  },

  render() {
    return (
      <div>
        <div className="panel panel-default" >

          <div className="panel-heading">
            <Row>
              <Col xs={12} >
                <span className="panel-title" style={{fontSize:"15px"}}>View Custom Fields</span>
                <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"5px", float:"right"}} onClick={this.showCreationModal}>
                  Add new custom field &nbsp; <Glyphicon glyph="plus" />
                </Button>
              </Col>
            </Row>
          </div>

          <div className="panel-body" >
            <Table hover condensed >
              <thead>
                <tr>
                  <th style={{width:"30%", borderBottom: "1px solid #596a7b"}} className="text-left">Field Name</th>
                  <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-left">Field Type</th>
                  <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-center">Private?</th>
                  <th style={{width:"20%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset-Tracked?</th>
                  <th style={{width:"10%", borderBottom: "1px solid #596a7b"}}></th>
                </tr>
              </thead>
              <tbody>
                { this.state.existing_fields.map( (field, i) => {
                  return (
                    <tr key={i}>
                      <td data-th="Field Name" className="text-left">{field.name}</td>
                      <td data-th="Field Type" className="text-left">{FIELD_TYPES[field.field_type]}</td>
                      <td data-th="Private?" className="text-center">{field.private ? "Yes" : "No"}</td>
                      <td data-th="Asset-Tracked?" className="text-center">{field.asset_tracked ? "Yes" : "No"}</td>
                      <td className="text-center"><Button bsSize="small" bsStyle="danger" onClick={e => this.showDeleteModal(e, field)}>Delete</Button></td>
                    </tr>
                  )
                } ) }
              </tbody>
            </Table>
          </div>

          <div className="panel-footer">
            <Row>
              <Col md={12}>
                <Pagination next prev maxButtons={10} boundaryLinks ellipsis style={{float:"right", margin: "0px"}} bsSize="small" items={this.state.pageCount} activePage={this.state.page} onSelect={this.handlePageSelect} />
              </Col>
            </Row>
          </div>

        </div>


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

        <Modal show={this.state.showCreationModal} onHide={this.closeCreationModal}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Custom Field</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            { this.getCustomFieldCreationForm() }
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={this.closeCreationModal}>Close</Button>
            <Button bsStyle="info" bsSize="small" onClick={this.createField}>Create</Button>
          </Modal.Footer>
        </Modal>

      </div>
    )
  }
})

export default CustomFieldList
