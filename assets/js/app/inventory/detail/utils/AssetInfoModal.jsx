import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'
import LoanModal from '../../../loans/LoanModal'
import $ from 'jquery'

const AssetInfoModal = React.createClass({
  getInitialState() {
    return {
      fields:[],
      asset: null,
    }
  },

  componentWillReceiveProps(nprops) {
    if(nprops.assetTag!=null){
      this.refresh(nprops);
    }
  },


  refresh(nprops) {
    this.getAssetFields();
    this.getAsset(nprops);
  },

  getAssetFields() {
    var _this = this
    var url = "/api/fields/"
    var params = {
      all: true,
      asset_tracked: true
    }
    $.getJSON(url, params, function(data) {
      var fields = data.results
      for (var i=0; i<fields.length; i++) {
        var field = fields[i]
      }
      _this.setState({
        fields: data.results,
      })
    })
  },

  getAsset(nprops) {
    var _this = this
    var url = "/api/assets/" + nprops.assetTag + "/"
   
    $.getJSON(url, function(data) {
      console.log(data)
      _this.setState({
        asset: data,
      })
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
            var elem = value

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
      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>{this.state.asset.item}, &nbsp; &nbsp; Asset tag: {this.state.asset.tag}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
                      <td style={{width:"80%"}}>{this.state.asset.tag}</td>
                    </tr>
                  </tbody>
                </Table>
                <hr />
                { this.getCustomFieldTable() }
              </Col>
            </Row>

          </Modal.Body>
        </Modal>
      )
    }
  }

})

export default AssetInfoModal
