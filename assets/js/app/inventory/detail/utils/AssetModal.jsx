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
    }
  },


  render() {
    if (this.props.asset == null) {
      return null
    } else {
      var assetStatus = null
      var loanOrBackfillView = null
      var loanModal = null
      if (this.props.asset.status == "Loaned") {
        assetStatus = <Label bsSize="small" bsStyle="warning">Loaned</Label>
        loanOrBackfillView = (
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
          <LoanModal loan={this.props.asset.loan}
                     request={this.props.asset.loan.request}
                     show={this.state.showLoanModal}
                     onHide={e => {this.setState({showLoanModal: false})}}
                     refresh={e => {this.setState({showLoanModal: false})}}/>
        )
      } else if (this.props.asset.status == "Disbursed") {
        assetStatus = <Label bsSize="small" bsStyle="danger">Disbursed</Label>
      } else if (this.props.asset.status == "In Stock") {
        assetStatus = <Label bsSize="small" bsStyle="success">In Stock</Label>
      }
      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>Viewing Asset</Modal.Title>
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
                      <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.props.asset.item}</span></td>
                    </tr>
                    <tr>
                      <th style={{width:"20%"}}>Asset Tag:</th>
                      <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.props.asset.tag}</span></td>
                    </tr>
                    { loanOrBackfillView }
                  </tbody>
                </Table>
              </Col>
            </Row>

            { loanModal }

          </Modal.Body>
        </Modal>
      )
    }
  }

})

export default AssetModal
