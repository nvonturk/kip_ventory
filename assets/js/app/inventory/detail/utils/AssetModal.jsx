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
      modifyFields: {},
      errorNodes: {},
      newTagName: "",
    }
  },

  componentWillReceiveProps(nprops) {
    var _this = this
    if (nprops.asset != null) {
      this.updateAsset(nprops.asset)
      this.setState({
        newTagName: nprops.asset.tag,
        modifyFields: {},
        errorNodes: {},
      })
    }
  },

  updateAsset(asset) {
    var _this = this;
    this.setState({
      asset: asset
    }, _this.getAssetFields)
  },

  getAssetFields() {
    var _this = this
    var url = "/api/fields/"
    var params = {
      all: true,
      asset_tracked: true
    }
    getJSON(url, params, function(data) {
      var modifyFields = {}
      var fields = data.results
      for (var i=0; i<fields.length; i++) {
        var field = fields[i]
        modifyFields[field.name] = false
      }
      _this.setState({
        fields: data.results,
        modifyFields: modifyFields
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

  handleTagNameChange(e){
    this.setState({
      newTagName: e.target.value,
    })
  },

  getShortTextField(field_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)} style={{marginBottom: "0px"}}>
        <FormControl type="text"
                     value={this.state.asset[field_name]}
                     name={field_name}
                     onChange={this.handleFieldChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getLongTextField(field_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)} style={{marginBottom: "0px"}}>
        <FormControl type="text"
                     style={{resize: "vertical", height:"100px"}}
                     componentClass={"textarea"}
                     value={this.state.asset[field_name]}
                     name={field_name}
                     onChange={this.handleFieldChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getIntegerField(field_name, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)} style={{marginBottom: "0px"}}>
        <FormControl type="number"
                     step={step}
                     value={this.state.asset[field_name]}
                     name={field_name}
                     onChange={this.handleFieldChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getFloatField(field_name, i){
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)} style={{marginBottom: "0px"}}>
        <FormControl type="number"
                     value={this.state.asset[field_name]}
                     name={field_name}
                     onChange={this.handleFieldChange} />
        { this.state.errorNodes[field_name] }
      </FormGroup>
    )
  },

  getValidationState(key) {
    return (this.state.errorNodes[key] == null) ? null : "error"
  },

  modifyAsset(e) {
    e.stopPropagation()
    e.preventDefault()
    var url = "/api/items/" + this.state.asset.item + "/assets/" + this.state.asset.tag + "/"
    var data = this.state.asset
    data.tag = this.state.newTagName
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
        _this.props.assetRefresh();
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

  enableAssetFieldModify(field_name) {
    var modifyFields = JSON.parse(JSON.stringify(this.state.modifyFields))
    modifyFields[field_name] = true
    this.setState({
      modifyFields: modifyFields
    })
  },

  disableAssetFieldModify(field_name) {
    var modifyFields = JSON.parse(JSON.stringify(this.state.modifyFields))
    modifyFields[field_name] = false
    this.setState({
      modifyFields: modifyFields
    })
  },

  getCustomFieldTable() {
    return (
      <Table condensed style={{fontSize:"14px"}}>
        <tbody>

          { this.state.fields.map ( (field, i) => {
            var field_name = field.name
            var is_private = field.private
            var field_type = field.field_type
            var value = this.state.asset[field_name]
            var elem = null

            switch(field_type) {
              case "Single":
                elem = this.getShortTextField(field_name, i)
                break;
              case "Multi":
                elem = this.getLongTextField(field_name, i)
                break;
              case "Int":
                elem = this.getIntegerField(field_name, 1, i)
                break;
              case "Float":
                elem = this.getFloatField(field_name, i)
                break
              default:
                return null
            }


            return (
              <tr>
                <th style={{width:"20%", verticalAlign: "middle"}}>{field_name}:</th>
                <td style={{width:"80%", verticalAlign: "middle"}}>{elem}</td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    )
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
                     refresh={this.props.refresh}
                     user={this.props.user} />
        )
      } else if (this.state.asset.status == "Disbursed") {
        assetStatus = <Label bsSize="small" bsStyle="primary">Disbursed</Label>
        loanOrDisbursementOrBackfillView = (
          <tr>
            <th style={{width:"20%"}}>Disbursed to:</th>
            <td style={{width:"80%"}}>{ this.state.asset.disbursement.request.requester}</td>
          </tr>
        )
      } else if (this.state.asset.status == "In Stock") {
        assetStatus = <Label bsSize="small" bsStyle="success">In Stock</Label>
      } else if (this.state.asset.status == "Lost") {
        assetStatus = <Label bsSize="small" bsStyle="danger">Lost</Label>
      }

      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>{this.state.asset.item}, &nbsp; &nbsp; Asset tag: {this.state.newTagName}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col xs={12}>
                <span style={{float:"right", fontSize:"14px"}}>Status: &nbsp; &nbsp; { assetStatus }</span>
              </Col>
            </Row>

            <Row>
              <Col xs={10} xsOffset={1}>
                <Table condensed style={{fontSize:"14px"}}>
                  <tbody>
                    <tr>
                      <th style={{width:"20%"}}>Item:</th>
                      <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.state.asset.item}</span></td>
                    </tr>
                    <tr>
                      <th style={{width:"20%"}}>Asset Tag:</th>
                      <td style={{width:"80%"}}><FormGroup key={"tag"} bsSize="small" validationState={this.getValidationState("tag")} style={{marginBottom: "0px"}}>
                        <FormControl type="number"
                                     value={this.state.newTagName}
                                     name={"tag"}
                                     onChange={this.handleTagNameChange} />
                        { this.state.errorNodes["tag"] }
                      </FormGroup></td>
                    </tr>
                    { loanOrDisbursementOrBackfillView }
                  </tbody>
                </Table>
                <hr />
                { this.getCustomFieldTable() }
              </Col>
            </Row>

            { loanModal }

          </Modal.Body>
          <Modal.Footer>
            <div style={{float: "right"}}>
              <Button bsSize="small" bsStyle="danger" style={{marginRight: "20px"}} onClick={e => {this.props.onHide();}}>Cancel</Button>
              <Button bsSize="small" bsStyle="info" onClick={this.modifyAsset}>Save</Button>
            </div>
          </Modal.Footer>
        </Modal>
      )
    }
  }

})

export default AssetModal
