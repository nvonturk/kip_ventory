import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Image } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import LoanInfoView from '../loans/LoanInfoView'
import AssetModal from '../inventory/detail/utils/AssetModal'
import Select from 'react-select'

const BackfillRequestModal = React.createClass({
  getInitialState() {
    return {
      "admin_comment": "",
      "status": "",
      errorNodes: {},
    }
  },

  componentWillReceiveProps(nProps) {
    if (nProps.backfillRequest != null) {
      if (nProps.backfillRequest.asset != null) {
        this.setState({
          admin_comment: nProps.backfillRequest.admin_comment,
          status: nProps.backfillRequest.status,
        })
      }
    }
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
    var url = "/api/backfillrequests/" + this.props.backfillRequest.id + "/"
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
          admin_comment: "",
					status: response.status,
          errorNodes: {}
        }, () => {_this.props.updateBackfillRequest(); _this.props.refresh();})
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

  getBackfillRequestValidationState(field_name) {
    return (this.state.errorNodes[field_name] == null) ? null : "error"
  },

  getBackfillInfoTable() {
    var adminResponse = (this.props.backfillRequest.status != "O") ? (
      <tr>
        <th style={{width:"30%", verticalAlign: "middle"}}>Admin Response:</th>
        <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfillRequest.admin_comment}</td>
      </tr>
    ) : null
    var assetRow = (this.props.backfillRequest.asset != null) ? (
      <tr>
        <th style={{width:"30%", verticalAlign: "middle"}}>Asset Tag:</th>
        <td style={{width:"70%", verticalAlign: "middle"}}>
          {this.props.backfillRequest.asset}
        </td>
      </tr>
    ) : null
    return (
      <Table condensed style={{marginBottom: "0px", fontSize:"14px"}}>
        <tbody>
          <tr>
            <th style={{width:"30%", verticalAlign: "middle"}}>Item:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>
              <a className="clickable" style={{color: "#df691a"}}
                 onClick={e => {browserHistory.push("/app/items/" + this.props.backfillRequest.item + "/")}}>
                 {this.props.backfillRequest.item}
              </a>
            </td>
          </tr>
          { assetRow }
          <tr>
            <th style={{width:"30%", verticalAlign: "middle"}}>Backfill quantity:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfillRequest.quantity}</td>
          </tr>
          <tr style={{marginBottom: "10px"}}>
            <th style={{width:"30%", verticalAlign: "middle"}}>Justification:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfillRequest.requester_comment}</td>
          </tr>
          <tr>
            <th style={{width:"30%", verticalAlign: "middle"}}>Uploaded receipt:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>
              <Image src={this.props.backfillRequest.receipt}
                     responsive
                     className="clickable"
                     onClick={e => {window.open(this.props.backfillRequest.receipt,'_blank')}} />
            </td>
          </tr>
          { adminResponse }
        </tbody>
      </Table>
    )
  },

  handleBackfillRequestFormChange(e) {
    this.setState({
      [e.target.name] : e.target.value
    });
  },

  getBackfillRequestPanel() {
    var adminResponse = (this.props.backfillRequest.status != "O") ? (
      <tr>
        <th style={{width:"30%", verticalAlign: "middle"}}>Admin Response:</th>
        <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfillRequest.admin_comment}</td>
      </tr>
    ) : null
    var approvalForm = ((this.props.user.is_staff || this.props.user.is_superuser) && this.props.backfillRequest.status == "O") ? (
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
    return (this.props.backfillRequest != null) ? (
      <Row>
        <Col xs={12}>
          <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>
            { this.getBackfillInfoTable() }
            { approvalForm }
          </Panel>
        </Col>
      </Row>
    ) : null
  },

  render() {
    if (this.props.backfillRequest == null) {
      return null
    } else {
      var statusLabel = null
      if (this.props.backfillRequest.status == "O") {
        statusLabel = (<Label bsSize="small" bsStyle="warning">Outstanding</Label>)
      } else if (this.props.backfillRequest.status == "A") {
        statusLabel = (<Label bsSize="small" bsStyle="success">Approved</Label>)
      } else {
        statusLabel = (<Label bsSize="small" bsStyle="warning">Outstanding</Label>)
      }
      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>
              Viewing Backfill Request #{this.props.backfillRequest.id}
              <span style={{float:"right", fontSize:"14px", marginRight:"15px"}}>
                {statusLabel}
              </span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
                <Col xs={12}>
                  { this.getBackfillRequestPanel() }
                </Col>
            </Row>
          </Modal.Body>

        </Modal>
      )
    }
  }

})


export default BackfillRequestModal
