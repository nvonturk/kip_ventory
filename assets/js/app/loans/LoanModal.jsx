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
      disburseQuantity: 0,
      returnQuantity: 0,
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.loan != null) {
      this.setState({
        returnQuantity: nextProps.loan.quantity_returned
      })
    }
  },

  handleReturnQuantityChange(e) {
    var q = Number(e.target.value)
    if ((q >= this.props.loan.quantity_returned) && (q <= (this.props.loan.quantity_loaned))) {
      this.setState({
        returnQuantity: q
      })
    }
  },

  handleDisburseQuantityChange(e) {
    var q = Number(e.target.value)
    if ((q >= 0) && (q <= (this.props.loan.quantity_loaned - this.props.loan.quantity_returned))) {
      this.setState({
        disburseQuantity: q
      })
    }
  },

  handleReturn(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/loans/" + this.props.loan.id + "/"
    var data = {
      quantity_returned: this.state.returnQuantity
    }
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          returnQuantity: 0,
        }, () => {_this.props.onHide(); _this.props.refresh();})
      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  handleDisbursement(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/loans/" + this.props.loan.id + "/convert/"
    var data = {
      quantity: this.state.disburseQuantity
    }
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          disburseQuantity: 0,
        }, () => {_this.props.onHide(); _this.props.refresh();})
      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  isDisburseDisabled() {
    return (this.state.disburseQuantity == 0)
  },

  render() {

    if (this.props.loan == null) {
      return null
    } else {

      var statusLabel = (this.props.loan.quantity_loaned == this.props.loan.quantity_returned) ? (
        <Label bsSize="small" bsStyle="success">Returned</Label>
      ) : (
        <Label bsSize="small" bsStyle="warning">Outstanding</Label>
      )
      var assetTag = (this.props.loan.asset != null) ? (
        <tr>
          <th style={{width:"20%"}}>Asset Tag:</th>
          <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.props.loan.asset}</span></td>
        </tr>
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
                  <Col xs={12}>
                    <span style={{float:"right", fontSize:"12px"}}>Status: &nbsp; &nbsp; {statusLabel}</span>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} xs={12}>
                    <Table condensed style={{fontSize:"14px"}}>
                      <tbody>
                        <tr>
                          <th style={{width:"30%"}}>Item:</th>
                          <td style={{width:"70%"}}><span style={{color: "rgb(223, 105, 26)"}}>{this.props.loan.item}</span></td>
                        </tr>
                        { assetTag }
                        <tr>
                          <th style={{width:"30%", verticalAlign: "middle"}}>Loaned to:</th>
                          <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.request.requester}</td>
                        </tr>
                        <tr>
                          <th style={{width:"30%", verticalAlign: "middle"}}>Justification:</th>
                          <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.request.open_comment}</td>
                        </tr>
                        <tr>
                        <th style={{width:"30%", verticalAlign: "middle"}}>Approval date:</th>
                        <td style={{width:"70%", verticalAlign: "middle"}}>{new Date(this.props.loan.date_loaned).toLocaleString()}</td>

                        </tr>
                        <tr>
                          <th style={{width:"30%", verticalAlign: "middle"}}>Admin comments:</th>
                          <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.request.closed_comment}</td>
                        </tr>
                        <tr>
                          <th style={{width:"30%", verticalAlign: "middle"}}>Number Loaned:</th>
                          <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.loan.quantity_loaned} instance(s)</td>
                        </tr>
                        <tr>
                          <th style={{width:"30%", verticalAlign: "middle"}}>Number Returned:</th>
                          <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.loan.quantity_returned} instance(s)</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>


                <Row>
                  <Col xs={12}>
                  <hr />
                    <h5>
                      Log a Return
                    </h5>

                    <Form horizontal>
                      <FormGroup bsSize="small">
                        <Col xs={4} componentClass={ControlLabel}>
                          Quantity Returned:
                        </Col>
                        <Col xs={4}>
                          <FormControl type="number" name="returnQuantity" value={this.state.returnQuantity}
                                       onChange={this.handleReturnQuantityChange} min={this.props.loan.quantity_returned} step={1} max={this.props.loan.quantity_loaned} />
                        </Col>
                        <Col xs={4}>
                          <Button bsStyle="info" bsSize="small" style={{fontSize: "12px"}} onClick={this.handleReturn}>
                            Log Return
                          </Button>
                        </Col>
                      </FormGroup>
                    </Form>
                  </Col>

                  <Col xs={12}>
                    <hr />
                  </Col>

                  <Col xs={12}>
                    <h5>
                      Convert to Disbursement
                    </h5>

                    <Form horizontal>
                      <FormGroup bsSize="small">
                        <Col xs={4} componentClass={ControlLabel}>
                          Quantity to Disburse
                        </Col>
                        <Col xs={4}>
                          <FormControl type="number" name="disburseQuantity" value={this.state.disburseQuantity}
                                       onChange={this.handleDisburseQuantityChange} min={0} step={1} max={this.props.loan.quantity_loaned}/>
                        </Col>
                        <Col xs={4}>
                          <Button bsStyle="info" bsSize="small" disabled={this.isDisburseDisabled()} style={{fontSize: "12px"}} onClick={this.handleDisbursement}>
                            Disburse Instances
                          </Button>
                        </Col>
                      </FormGroup>
                    </Form>
                    <hr />
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
