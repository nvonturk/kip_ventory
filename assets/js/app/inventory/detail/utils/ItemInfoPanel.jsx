import React from 'react'
import { Grid, Row, Col, Tabs, Tab, Nav, NavItem, Button, Modal, Table,
         Checkbox, Form, FormGroup, InputGroup, FormControl, Pagination,
         ControlLabel, Glyphicon, HelpBlock, Panel, Label, Well, OverlayTrigger, Popover }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../../csrf/DjangoCSRFToken'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../../TagMultiSelect'
import Select from 'react-select'
import LoanModal from '../../../loans/LoanModal'

const ItemInfoPanel = React.createClass({
  getInitialState() {
    return {
      modifiedItem: {},

      showModifyModal: false,
      showDeleteModal: false,

      errorNodes: {}
    }
  },

  handleItemFormChange(e) {
    e.preventDefault()
    var item = this.state.modifiedItem
    var errorNodes = this.state.errorNodes
    errorNodes[e.target.name] = null
    item[e.target.name] = e.target.value

    this.setState({
      modifiedItem: item,
      errorNodes: errorNodes
    })
  },

  handleItemFormCheckbox(e){
    var item = this.state.modifiedItem
    item.has_assets = e.target.checked
    this.setState({
      modifiedItem: item,
    })
  },

  handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/items/" + this.props.item.name + "/"
    var data = this.state.modifiedItem
    var _this = this
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
      },
      error: function(xhr, textStatus, thrownError) {
        if (xhr.status == 400) {
          var response = xhr.responseJSON
          var errNodes = {}
          for (var key in response) {
            if (response.hasOwnProperty(key)) {
              var node = <span key={key} className="help-block">{response[key][0]}</span>
              errNodes[key] = node
            }
          }
          _this.setState({
            errorNodes: errNodes
          })
        }
      }
    })
  },

  handleTagSelection(tagsSelected) {
    var item = this.state.modifiedItem
    var tags = tagsSelected.split(",")
    if (tags.length == 1) {
      if (tags[0] == "") {
        tags = []
      }
    }
    item.tags = tags
    this.setState({modifiedItem: item});
  },

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="text"
                     value={this.state.modifiedItem[field_name]}
                     name={field_name}
                     onChange={this.handleItemFormChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
          <ControlLabel>{presentation_name}</ControlLabel>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.modifiedItem[field_name]}
                       name={field_name}
                       onChange={this.handleItemFormChange} />
          { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="number"
                     min={min}
                     step={step}
                     value={this.state.modifiedItem[field_name]}
                     name={field_name}
                     onChange={this.handleItemFormChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <ControlLabel>{presentation_name} </ControlLabel>
        <FormControl type="number"
                     value={this.state.modifiedItem[field_name]}
                     name={field_name}
                     onChange={this.handleItemFormChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getCustomFieldForms() {
    return this.props.customFields.map( (field, i) => {

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

  getValidationState(key) {
    return (this.state.errorNodes[key] == null) ? null : "error"
  },

  showEditModal(e) {
    var itemCopy = JSON.parse(JSON.stringify(this.props.item))
    this.setState({
      modifiedItem: itemCopy,
      showModifyModal: true,
      errorNodes: {}
    })
  },

  closeEditModal(e) {
    var itemCopy = JSON.parse(JSON.stringify(this.props.item))
    this.setState({
      modifiedItem: itemCopy,
      showModifyModal: false,
      errorNodes: {}
    })
  },

  deleteItem(e) {
    e.preventDefault()
    var url = "/api/items/" + this.props.item.name + "/"
    ajax({
      url: url,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var new_url = "/app/inventory/"
        browserHistory.push(new_url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  getItemInfoPanel() {
    var deleteIcon = null; var editIcon = null; var minStock = null
    if (this.props.user.is_superuser) {
      deleteIcon = <Glyphicon glyph="trash" style={{paddingLeft: "20px"}} onClick={e => {this.setState({showDeleteModal: true})}}/>
    }
    if (this.props.user.is_staff || this.props.user.is_superuser) {
      editIcon = <Glyphicon glyph="edit" onClick={this.showEditModal}/>
      minStock = (
        <tr>
          <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Minimum Stock</th>
          <td style={{border: "1px solid #596a7b"}}>{this.props.item.minimum_stock}</td>
        </tr>
      )
    }

    return (
      <Panel header={
        <div>
          <span style={{fontSize:"15px"}}>Item Details</span>
          <span className="clickable" style={{float: "right"}}>
            { editIcon }
            { deleteIcon }
          </span>
        </div>} >
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>
            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Name</th>
              <td style={{border: "1px solid #596a7b"}}>{this.props.item.name}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Model No.</th>
              <td style={{border: "1px solid #596a7b"}}>{this.props.item.model_no}</td>
            </tr>

            { minStock }

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Description</th>
              <td style={{border: "1px solid #596a7b"}}>
                <pre style={{fontFamily: '"Lato","Helvetica Neue",Helvetica,Arial,sans-serif',
                             color:"white",
                             fontSize:"12px",
                             border: "0px",
                             backgroundColor:"inherit",
                             margin: "auto", padding: "0px",
                             wordBreak: "break-word"}}>
                  {this.props.item.description}
                </pre>
              </td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Tags</th>
              <td style={{border: "1px solid #596a7b"}}>{this.props.item.tags.join(", ")}</td>
            </tr>

            {this.props.customFields.map( (cf, i) => {
              return (
                <tr key={i}>
                  <th style={{paddingRight:"10px", border: "1px solid #596a7b"}}>{cf.name}</th>
                  <td style={{border: "1px solid #596a7b"}}>{this.props.item[cf.name]}</td>
                </tr>
              )
            })}

          </tbody>
        </Table>
      </Panel>
    )
  },

  render() {
    var popover = (
      <Popover id="popover">
        <p style={{marginBottom: "0px", verticalAlign: "middle", textAlign: "center"}}>
          Only administrators may directly modify quantity.
        </p>
      </Popover>
    )
    if (this.props.user.is_superuser) {
      popover = (
        <Popover id="popover">
          <p style={{marginBottom: "0px", verticalAlign: "middle", textAlign: "center"}}>
            Administrators may only modify quantity on <strong>non-asset-tracked items</strong>.
          </p>
        </Popover>
      )
    }
    var quantityForm = (!this.props.user.is_superuser || this.props.item.has_assets) ? (
      <OverlayTrigger trigger={['hover', 'focus']} placement="right" overlay={popover}>
        <FormControl disabled={!this.props.user.is_superuser || this.props.item.has_assets}
                     type="number"
                     name="quantity"
                     value={this.state.modifiedItem.quantity}
                     onChange={this.handleItemFormChange}/>
      </OverlayTrigger>
    ) : (
      <FormControl disabled={!this.props.user.is_superuser || this.props.item.has_assets}
                   type="number"
                   name="quantity"
                   value={this.state.modifiedItem.quantity}
                   onChange={this.handleItemFormChange}/>
    )
    return (
      <Row>
        <Col xs={12}>
          { this.getItemInfoPanel() }

          <Modal show={this.state.showDeleteModal} onHide={e => this.setState({showDeleteModal: false})}>
            <Modal.Header closeButton>
              <Modal.Title>Delete Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p style={{fontSize: "14px"}}>Are you sure you want to delete this item?</p>
            </Modal.Body>
            <Modal.Footer>
              <Button bsSize="small" onClick={e => this.setState({showDeleteModal: false})}>Cancel</Button>
              <Button bsStyle="danger" bsSize="small" onClick={this.deleteItem}>Delete</Button>
            </Modal.Footer>
          </Modal>

          <Modal show={this.state.showModifyModal} onHide={this.closeEditModal}>
            <Modal.Header closeButton>
              <Modal.Title>Modify Item</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={this.handleSubmit}>
                <Row>
                  <Col xs={12}>
                    <FormGroup bsSize="small" controlId="name" validationState={this.getValidationState("name")}>
                      <ControlLabel>Name<span style={{color:"red"}}>*</span></ControlLabel>
                      <FormControl type="text" name="name" value={this.state.modifiedItem.name} onChange={this.handleItemFormChange}/>
                      { this.state.errorNodes['name'] }
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} xs={12}>
                    <FormGroup bsSize="small" controlId="model_no" validationState={this.getValidationState('model_no')}>
                      <ControlLabel>Model No.</ControlLabel>
                      <FormControl type="text"
                                   name="model_no"
                                   value={this.state.modifiedItem.model_no}
                                   onChange={this.handleItemFormChange}/>
                      { this.state.errorNodes['model_no'] }
                    </FormGroup>
                  </Col>
                  <Col md={3} xs={12}>
                    <FormGroup bsSize="small" controlId="quantity" validationState={this.getValidationState('quantity')}>
                      <ControlLabel>Quantity<span style={{color:"red"}}>*</span></ControlLabel>
                      { quantityForm }
                      { this.state.errorNodes['quantity'] }
                    </FormGroup>
                  </Col>
                  <Col md={3} xs={12}>
                    <FormGroup bsSize="small" controlId="quantity" validationState={this.getValidationState('minimum_stock')}>
                      <ControlLabel>Min Stock</ControlLabel>
                      <FormControl type="number"
                                   name="minimum_stock"
                                   value={this.state.modifiedItem.minimum_stock}
                                   onChange={this.handleItemFormChange}/>
                      { this.state.errorNodes['minimum_stock'] }
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col xs={12}>
                    <FormGroup bsSize="small" controlId="description">
                      <ControlLabel>Description</ControlLabel>
                      <FormControl type="text"
                                   style={{resize: "vertical", height:"100px"}}
                                   componentClass={"textarea"}
                                   name="description"
                                   value={this.state.modifiedItem.description}
                                   onChange={this.handleItemFormChange}/>
                      { this.state.errorNodes['description'] }
                    </FormGroup>
                  </Col>
                </Row>

                <Row>
                  <Col xs={8}>
                    <FormGroup bsSize="small" controlId="tags">
                      <ControlLabel>Tags</ControlLabel>
                      <TagMultiSelect tagsSelected={this.state.modifiedItem.tags} tagHandler={this.handleTagSelection}/>
                      { this.state.errorNodes['tags'] }
                    </FormGroup>
                  </Col>
                  <Col xs={4}>
                    <FormGroup bsSize="small" controlId="has_assets">
                      <ControlLabel>Has Assets</ControlLabel>
                      <Checkbox style={{paddingLeft: "6px"}} onChange={this.handleItemFormCheckbox} checked={this.state.modifiedItem.has_assets}  />
                    </FormGroup>
                  </Col>
                </Row>

                {this.getCustomFieldForms()}

              </Form>
            </Modal.Body>
            <Modal.Footer>
              <span style={{float:"right"}}>
                <Col xs={6}>
                  <Button type="submit" bsSize="small" bsStyle="default" style={{float:"right",fontSize:"10px"}} onClick={this.closeEditModal}>
                    Cancel
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button type="submit" bsSize="small" bsStyle="info" style={{float:"right",fontSize:"10px"}}
                          onClick={this.handleSubmit}>
                    Save
                  </Button>
                </Col>
              </span>
            </Modal.Footer>
          </Modal>

        </Col>
      </Row>
    )
  }
})

export default ItemInfoPanel
