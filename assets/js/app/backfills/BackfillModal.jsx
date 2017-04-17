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

const BackfillModal = React.createClass({
  getInitialState() {
    return {
      errorNodes: {},
    }
  },

	markBackfillAsSatisfied(e) {
    var url = "/api/backfills/" + this.props.backfill.id + "/"
    var data = {
      status: "satisfied"
    }
    var _this = this;
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
          errorNodes: {}
        }, () => {_this.props.updateBackfill(); _this.props.refresh();})
      },
      error:function (xhr, textStatus, thrownError){
        //todo 
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

  getBackfillValidationState(field_name) {
    return (this.state.errorNodes[field_name] == null) ? null : "error"
  },

  getBackfillInfoTable() {
    var adminResponse = (
      <tr>
        <th style={{width:"30%", verticalAlign: "middle"}}>Admin Response:</th>
        <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfill.admin_comment}</td>
      </tr>
    );
    var assetRow = (this.props.backfill.asset != null) ? (
      <tr>
        <th style={{width:"30%", verticalAlign: "middle"}}>Asset Tag:</th>
        <td style={{width:"70%", verticalAlign: "middle"}}>
          {this.props.backfill.asset}
        </td>
      </tr>
    ) : null


    //todo add date_created or date_satisfied?
    return (
      <Table condensed style={{marginBottom: "0px", fontSize:"14px"}}>
        <tbody>
          <tr>
            <th style={{width:"30%", verticalAlign: "middle"}}>Item:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>
              <a className="clickable" style={{color: "#df691a"}}
                 onClick={e => {browserHistory.push("/app/items/" + this.props.backfill.item + "/")}}>
                 {this.props.backfill.item}
              </a>
            </td>
          </tr>
          { assetRow }
          <tr>
            <th style={{width:"30%", verticalAlign: "middle"}}>Backfill quantity:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfill.quantity}</td>
          </tr>
          <tr style={{marginBottom: "10px"}}>
            <th style={{width:"30%", verticalAlign: "middle"}}>Justification:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>{this.props.backfill.requester_comment}</td>
          </tr>
          <tr>
            <th style={{width:"30%", verticalAlign: "middle"}}>Uploaded receipt:</th>
            <td style={{width:"70%", verticalAlign: "middle"}}>
              <Image src={this.props.backfill.receipt}
                     responsive
                     className="clickable"
                     onClick={e => {window.open(this.props.backfill.receipt,'_blank')}} />
            </td>
          </tr>
          { adminResponse }
        </tbody>
      </Table>
    )
  },

  getBackfillPanel() {
   
    return (this.props.backfill != null) ? (
      <Row>
        <Col xs={12}>
          <Panel style={{marginBottom: "0px", boxShadow: "0px 0px 5px 2px #485563"}}>
            { this.getBackfillInfoTable() }
          </Panel>
        </Col>
      </Row>
    ) : null
  },

  getMarkBackfillAsSatisfiedButton() {
    var markAsSatisfiedButton = (this.props.backfill.status != "satisfied") ? (
      <Button bsStyle="success" 
              bsSize="small"
              style={{fontSize: "12px"}}
              onClick={this.markBackfillAsSatisfied}>
        Mark Backfill as Satisfied
      </Button>
    ) : null;

    return markAsSatisfiedButton;
  },

  render() {
    if (this.props.backfill == null) {
      return null
    } else {
      var statusLabel = null
      if (this.props.backfill.status == "awaiting_items") {
        statusLabel = (<Label bsSize="small" bsStyle="warning">Awaiting Items</Label>)
      } else if (this.props.backfill.status == "satisfied") {
        statusLabel = (<Label bsSize="small" bsStyle="success">Satisfied</Label>)
      } 

      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>
              Viewing Backfill #{this.props.backfill.id}
              <span style={{float:"right", fontSize:"14px", marginRight:"15px"}}>
                {statusLabel}
              </span>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
                <Col xs={12}>
                  { this.getBackfillPanel() }
                </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
             { this.getMarkBackfillAsSatisfiedButton() }
          </Modal.Footer>
        </Modal>
      )
    }
  }

})


export default BackfillModal
