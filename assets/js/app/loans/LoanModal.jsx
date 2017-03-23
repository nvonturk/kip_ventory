import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'

const LoanModal = React.createClass({
  getInitialState() {
    return {
      loan: this.props.loan,

      showDisbursementForm: false,
      disbursementQuantity: 0,

      showReturnForm: false,
      returnQuantity: 0

    }
  },

  saveLoan() {
    var url = "/api/loans/" + this.props.loan.id + "/"
    console.log(url)
  },

  render() {
    if (this.props.loan == null) {
      return null
    } else {
      var statusLabel = (this.props.loan.quantity_loaned == this.props.loan.quantity_returned) ? (
        <Label bsSize="small" bsStyle="success">Returned</Label>
      ) : (
        <Label bsSize="small" bsStyle="danger">Outstanding</Label>
      )
      var saveButton = (this.state.showReturnForm || this.state.showDisbursementForm) ? (
          <Button bsStyle="info"    bsSize="small" onClick={this.saveLoan}>Save</Button>
      ) : null
      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>Viewing Loan #{this.props.loan.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>

            <Row>
              <Col xs={12}>
                <Row>
                  <Col xs={6}>
                    <h4 style={{marginTop: "0px", color: "rgb(223, 105, 26)"}}>
                      { this.props.loan.item.name }
                    </h4>
                  </Col>
                  <Col xs={6}>
                    <span style={{float:"right", fontSize:"12px"}}>Status: &nbsp; &nbsp; {statusLabel}</span>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} xs={12}>
                    <Table>
                      <tbody>
                        <tr>
                          <th style={{width:"40%", verticalAlign: "middle", border: "1px solid #596a7b"}}>Loaned to:</th>
                          <td style={{width:"60%", verticalAlign: "middle", border: "1px solid #596a7b", color: "rgb(223, 105, 26)"}}>{this.props.loan.request.requester}</td>
                        </tr>
                        <tr>
                          <th style={{width:"40%", verticalAlign: "middle", border: "1px solid #596a7b"}}>Justification:</th>
                          <td style={{width:"60%", verticalAlign: "middle", border: "1px solid #596a7b"}}>{this.props.loan.request.open_comment}</td>
                        </tr>
                        <tr>
                          <th style={{width:"40%", verticalAlign: "middle", border: "1px solid #596a7b"}}>Approval date:</th>
                          <td style={{width:"60%", verticalAlign: "middle", border: "1px solid #596a7b"}}>{new Date(this.props.loan.date_loaned).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <th style={{width:"40%", verticalAlign: "middle", border: "1px solid #596a7b"}}>Admin comments:</th>
                          <td style={{width:"60%", verticalAlign: "middle", border: "1px solid #596a7b"}}>{this.props.loan.request.closed_comment}</td>
                        </tr>
                        <tr>
                          <th style={{width:"40%", verticalAlign: "middle", border: "1px solid #596a7b"}}>Number Loaned:</th>
                          <td style={{width:"60%", verticalAlign: "middle", border: "1px solid #596a7b"}}>{this.props.loan.quantity_loaned} instance(s)</td>
                        </tr>
                        <tr>
                          <th style={{width:"40%", verticalAlign: "middle", border: "1px solid #596a7b"}}>Number Returned:</th>
                          <td style={{width:"60%", verticalAlign: "middle", border: "1px solid #596a7b"}}>{this.props.loan.quantity_returned} instance(s)</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

              </Col>
            </Row>

          </Modal.Body>
        </Modal>
      )
    }
  }

})

export default LoanModal
