import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'
import LoanModal from '../../../loans/LoanModal'

const AssetModal = React.createClass({
  getInitialState() {
    return {
      showLoanModal: false,
      asset: {},
      fields: [],
      errorNodes: {}
    }
  },

  componentWillReceiveProps(nprops) {
    var _this = this
    if (nprops.asset != null) {
      this.setState({
        asset: nprops.asset
      }, _this.getAssetFields)
    }
  },

  getAssetFields() {
    var _this = this
    var url = "/api/fields/"
    var params = {
      all: true,
      asset_tracked: true
    }
    getJSON(url, params, function(data) {
      _this.setState({
        fields: data.results
      })
    })
  },

  handleFieldChange(e) {
    var asset = JSON.parse(JSON.stringify(this.state.asset))
    asset[e.target.name] = e.target.value
    this.setState({
      asset: asset
    })
  },

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       value={this.state.asset[field_name]}
                       name={field_name}
                       onChange={this.handleFieldChange} />
        </Col>
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.asset[field_name]}
                       name={field_name}
                       onChange={this.handleFieldChange} />
        </Col>
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       step={step}
                       value={this.state.asset[field_name]}
                       name={field_name}
                       onChange={this.handleFieldChange} />
        </Col>
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       value={this.state.asset[field_name]}
                       name={field_name}
                       onChange={this.handleFieldChange} />
        </Col>
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getCustomFieldForms() {
    return this.state.fields.map( (field, i) => {

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
          return this.getIntegerField(field_name, field_name, 1, i)
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

  modifyAsset(e) {
    e.stopPropagation()
    e.preventDefault()
    var url = "/api/items/" + this.state.asset.item + "/assets/" + this.state.asset.tag + "/"
    var data = this.state.asset
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
        _this.props.refresh()
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


  render() {
    if (this.state.asset == null) {
      return null
    } else {
      var assetStatus = null
      var loanOrDisbursementOrBackfillView = null
      var loanModal = null
      if (this.state.asset.status == "Loaned") {
        assetStatus = <Label bsSize="small" bsStyle="warning">Loaned</Label>
        loanOrDisbursementOrBackfillView = (
          <tr>
            <th style={{width:"20%"}}>Loan Details:</th>
            <td style={{width:"80%"}}>
              <span style={{textDecoration: "underline", color: "#5bc0de"}}
                    className="clickable"
                    onClick={e => {this.setState({showLoanModal: true})}}>
                Click to view loan
              </span>
            </td>
          </tr>
        )
        loanModal = (
          <LoanModal loan={this.state.asset.loan}
                     request={this.state.asset.loan.request}
                     show={this.state.showLoanModal}
                     onHide={e => {this.setState({showLoanModal: false})}}
                     refresh={this.props.refresh}/>
        )
      } else if (this.state.asset.status == "Disbursed") {
        assetStatus = <Label bsSize="small" bsStyle="danger">Disbursed</Label>
        loanOrDisbursementOrBackfillView = (
          <tr>
            <th style={{width:"20%"}}>Disbursed to:</th>
            <td style={{width:"80%"}}>{ this.state.asset.disbursement.request.requester}</td>
          </tr>
        )
      } else if (this.state.asset.status == "In Stock") {
        assetStatus = <Label bsSize="small" bsStyle="success">In Stock</Label>
      }

      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>{this.state.asset.item}, &nbsp; &nbsp; Asset tag: {this.state.asset.tag}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col xs={12}>
                <span style={{float:"right", fontSize:"14px"}}>Status: &nbsp; &nbsp; { assetStatus }</span>
              </Col>
            </Row>

            <Row>
              <Col xs={12}>
                <Table condensed style={{fontSize:"14px"}}>
                  <tbody>
                    <tr>
                      <th style={{width:"20%"}}>Item:</th>
                      <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.state.asset.item}</span></td>
                    </tr>
                    <tr>
                      <th style={{width:"20%"}}>Asset Tag:</th>
                      <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.state.asset.tag}</span></td>
                    </tr>
                    { loanOrDisbursementOrBackfillView }
                  </tbody>
                </Table>
                <hr />
                <Form horizontal onSubmit={this.modifyAsset}>
                  { this.getCustomFieldForms() }
                </Form>
              </Col>
            </Row>

            { loanModal }

          </Modal.Body>
          <Modal.Footer>

          </Modal.Footer>
        </Modal>
      )
    }
  }

})

export default AssetModal
