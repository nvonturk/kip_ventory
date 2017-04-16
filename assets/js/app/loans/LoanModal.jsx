import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Image } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import LoanInfoView from './LoanInfoView'
import Select from 'react-select'

const LoanModal = React.createClass({
  getInitialState() {
    return {
      disburseQuantity: 0,
      returnQuantity: 0,

      requester_comment: "",
      receipt: null,

      errorNodes: {}
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.loan != null) {
      this.setState({
        returnQuantity: nextProps.loan.quantity_returned,
        disburseQuantity: 0,
        requester_comment: "",
        receipt: null,
        errorNodes: {},
      })
    }
  },

  handleReturnQuantityChange(e) {
    var q = Number(e.target.value)
    if ((q >= this.props.loan.quantity_returned) && (q <= (this.props.loan.quantity_loaned))) {
      this.setState({
        returnQuantity: q,
        errorNodes: {}
      })
    }
  },

  handleDisburseQuantityChange(e) {
    var q = Number(e.target.value)
    if ((q >= 0) && (q <= (this.props.loan.quantity_loaned - this.props.loan.quantity_returned))) {
      this.setState({
        disburseQuantity: q,
        errorNodes: {}
      })
    }
  },

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
      errorNodes: {}
    })
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
          errorNodes: {}
        }, () => {_this.props.refresh(); _this.props.updateLoan();})
      },
      error:function (xhr, textStatus, thrownError){
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
          errorNodes: {}
        }, () => {_this.props.onHide(); _this.props.refresh();})
      },
      error:function (xhr, textStatus, thrownError){
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
    });
  },

  isDisburseDisabled() {
    return (this.state.disburseQuantity == 0)
  },

  handleBackfillRequestFormChange(e) {
    this.setState({
      [e.target.name] : e.target.value
    });
  },

  handleBackfillRequestFileChange(e) {
    let reader = new FileReader();
    let file = e.target.files[0];
    reader.onloadend = () => {
      this.setState({
        receipt: file,
      });
    }
    reader.readAsDataURL(file)
  },

  getBackfillRequestValidationState(field_name) {
    return (this.state.errorNodes[field_name] == null) ? null : "error"
  },

  refreshBackfillRequest(status) {
    this.props.refresh()
    if (status != "A") {
      this.props.updateLoan()
    } else {
      this.props.onHide()
    }
  },

  createBackfillRequest() {
    var url = '/api/loans/' + this.props.loan.id + '/requestforbackfill/';
    var fd = new FormData();
    fd.append('receipt', this.state.receipt);
    fd.append('requester_comment', this.state.requester_comment);
    var _this = this;
    ajax({
      url: url,
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success: function(response) {
        _this.refreshBackfillRequest("O")
      },
      // TODO : BETTER ERROR HANDLING. PARSE THE RESULT, AND ASSOCIATE WITH THE CORRECT FORM FIELD
      // USE THE <HelpBlock /> component to add subtext to the forms that failed the test.
      error:function (xhr, textStatus, thrownError) {
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
    });
  },

  getRequestBackfillPanel() {
    return (this.props.user.username == this.props.request.requester) ? (
      <Row>
        <Col xs={12}>
          <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}} header={<h4>Request for backfill</h4>}>
            <Form horizontal>
              <Row>
                <Col xs={12}>
                  <FormGroup bsSize="small" controlId="requester_comment" validationState={this.getBackfillRequestValidationState("requester_comment")}>
                    <Col xs={3} componentClass={ControlLabel}>
                      Comment<span style={{color:"red"}}>*</span>
                    </Col>
                    <Col xs={8}>
                      <FormControl componentClass="textarea"
                                   type="text"
                                   name="requester_comment"
                                   value={this.state.requester_comment}
                                   onChange={this.handleBackfillRequestFormChange}/>
                      { this.state.errorNodes['requester_comment'] }
                    </Col>
                  </FormGroup>

                  <FormGroup bsSize="small" controlId="receipt" validationState={this.getBackfillRequestValidationState('receipt')}>
                    <Col xs={3} componentClass={ControlLabel}>
                      Proof of Purchase<span style={{color:"red"}}>*</span>
                    </Col>
                    <Col xs={8}>
                      <FormControl  type="file"
                                    name="Choose file"
                                    onChange={this.handleBackfillRequestFileChange} />
                      { this.state.errorNodes['receipt'] }
                    </Col>
                  </FormGroup>
                </Col>
                <Col xs={4} xsOffset={8}>
                  <Button block bsStyle="info" bsSize="small" style={{float: "right", fontSize: "12px"}} onClick={this.createBackfillRequest}>Request Backfill</Button>
                </Col>
              </Row>
            </Form>
          </Panel>
        </Col>
      </Row>
    ) : null
  },

  approveBackfillRequest() {
		var _this = this
		this.setState({
			status: "A"
		}, _this.modifyBackfillRequest)
	},

	denyBackfillRequest() {
		var _this = this
		this.setState({
			status: "D",
		}, _this.modifyBackfillRequest)
	},

	modifyBackfillRequest(e) {
    var url = "/api/backfillrequests/" + this.props.loan.outstanding_backfill_request.id + "/"
    var data = {
      admin_comment: this.state.admin_comment,
			status: this.state.status
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
          requester_comment: "",
          admin_comment: "",
          receipt: null,
					status: response.status
        }, () => {_this.refreshBackfillRequest(_this.state.status)})
      },
      error:function (xhr, textStatus, thrownError){
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
    });
	},


  getBackfillRequestedPanel() {
    var approvalForm = (this.props.user.is_staff || this.props.user.is_superuser) ? (
      <Form horizontal onSubmit={e => {e.preventDefault()}}>
        <hr />
        <Col xs={12}>
          <FormGroup bsSize="small" controlId="admin_comment" validationState={this.getBackfillRequestValidationState("admin_comment")}>
            <Col xs={3} componentClass={ControlLabel}>
              Admin Response
            </Col>
            <Col xs={8}>
              <FormControl componentClass="textarea"
                           style={{resize: "vertical", height:"100px"}}
                           type="text"
                           name="admin_comment"
                           value={this.state.admin_comment}
                           onChange={this.handleBackfillRequestFormChange}/>
              { this.state.errorNodes['admin_comment'] }
            </Col>
          </FormGroup>
        </Col>
        <Col xs={4} xsOffset={4}>
          <Button bsStyle="success" bsSize="small"
                  style={{marginRight: "15px", fontSize: "12px"}}
                  onClick={this.approveBackfillRequest}>
            Approve
          </Button>
          <Button bsStyle="danger" bsSize="small"
                  style={{fontSize: "12px"}}
                  onClick={this.denyBackfillRequest}>
            Deny
          </Button>
        </Col>
      </Form>
    ) : null
    return (this.props.loan.outstanding_backfill_request != null) ? (
      <Row>
        <Col xs={12}>
          <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}} header={<h4>Backfill Requested</h4>}>
            <p className="text-center" style={{fontSize:"12px"}}>This loan has been requested for backfill and is awaiting administrator approval.</p>
            <Table condensed style={{marginBottom: "0px", fontSize:"14px"}}>
              <tbody>
                <tr>
                  <th style={{width:"30%", verticalAlign: "middle"}}>Backfill ID:</th>
                  <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.loan.outstanding_backfill_request.id}</td>
                </tr>
                <tr>
                  <th style={{width:"30%", verticalAlign: "middle"}}>Backfill quantity:</th>
                  <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.loan.outstanding_backfill_request.quantity}</td>
                </tr>
                <tr style={{marginBottom: "10px"}}>
                  <th style={{width:"30%", verticalAlign: "middle"}}>Justification:</th>
                  <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.loan.outstanding_backfill_request.requester_comment}</td>
                </tr>
                <tr>
                  <th style={{width:"30%", verticalAlign: "middle"}}>Uploaded receipt:</th>
                  <td style={{width:"70%", verticalAlign: "middle"}}>
                    <Image src={this.props.loan.outstanding_backfill_request.receipt}
                           responsive
                           className="clickable"
                           onClick={e => {window.location.assign(this.props.loan.outstanding_backfill_request.receipt)}}/>
                  </td>
                </tr>
              </tbody>
            </Table>
            { approvalForm }
          </Panel>
        </Col>
      </Row>
    ) : null
  },

  render() {
    if (this.props.loan == null) {
      return null
    } else {
      var returnHeader = <h4 >Log a return</h4>
      var disburseHeader = <h4>Convert to disbursement</h4>

      var adminForms = ((this.props.user.is_staff || this.props.user.is_superuser) && (this.props.loan.quantity_loaned > this.props.loan.quantity_returned)) ? (
        <Row>
          <Col xs={6}>
            <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}} header={returnHeader}>
              <Form>
                <FormGroup bsSize="small">
                  <ControlLabel>
                    Quantity Returned
                  </ControlLabel>
                  <FormControl type="number" name="returnQuantity" value={this.state.returnQuantity}
                               onChange={this.handleReturnQuantityChange} min={this.props.loan.quantity_returned} step={1} max={this.props.loan.quantity_loaned} />
                </FormGroup>
                <FormGroup bsSize="small">
                  <Button bsStyle="info" bsSize="small"
                          style={{fontSize: "12px", float: "right"}} onClick={this.handleReturn}>
                    Log Return
                  </Button>
                </FormGroup>
              </Form>
            </Panel>
          </Col>

          <Col xs={6}>
            <Panel style={{boxShadow: "0px 0px 5px 2px #485563"}} header={disburseHeader}>
              <Form>
                <FormGroup bsSize="small">
                  <ControlLabel>
                    Quantity to Disburse
                  </ControlLabel>
                  <FormControl type="number" name="disburseQuantity" value={this.state.disburseQuantity}
                               onChange={this.handleDisburseQuantityChange} min={0} step={1} max={this.props.loan.quantity_loaned}/>
                </FormGroup>
                <FormGroup bsSize="small">
                  <Button bsStyle="info" bsSize="small" disabled={this.isDisburseDisabled()}
                          style={{fontSize: "12px", float: "right"}} onClick={this.handleDisbursement}>
                    Disburse
                  </Button>
                </FormGroup>
              </Form>
            </Panel>
          </Col>
        </Row>
      ) : null
      var backfillRequestForm = null
      if (this.props.loan.quantity_loaned > this.props.loan.quantity_returned) {
        if (this.props.loan.outstanding_backfill_request === null) {
          backfillRequestForm = this.getRequestBackfillPanel()
        } else {
          backfillRequestForm = this.getBackfillRequestedPanel()
        }
      }

      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>Viewing Loan #{this.props.loan.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col xs={12}>
                <LoanInfoView loan={this.props.loan} request={this.props.request}/>
                { adminForms }
                { backfillRequestForm }
              </Col>
            </Row>
          </Modal.Body>
        </Modal>
      )
    }
  }

})

export default LoanModal
