import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import LoanInfoView from './LoanInfoView'
import BackfillRequestForm from './BackfillRequestForm'

const BackfillRequestModal = React.createClass({
  getInitialState() {
    return {
      requester_comment: "",
      receipt: null,
      errorNodes: [],
    }
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

  createBackfillRequest() {
    console.log(this.state);

    var url = '/api/loans/' + this.props.loan.id + '/requestforbackfill/';
    var data = {
      requester_comment: this.state.requester_comment,
      receipt: "rwar",//this.state.receipt,
    };
    var fd = new FormData();
    fd.append('receipt', this.state.receipt);
    fd.append('requester_comment', this.state.requester_comment);
    console.log(fd.get('receipt'));
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
        console.log('success');
        _this.props.createBackfillRequestSuccessHandler()
      
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

  render() {
    if (this.props.loan == null) {
      return null
    } else {
      return (
        <Modal show={this.props.show} onHide={this.props.onHide}>
          <Modal.Header closeButton>
            <Modal.Title>Request Loan #{this.props.loan.id} for Backfill</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <LoanInfoView loan={this.props.loan} request={this.props.request}/>
            <BackfillRequestForm comment={this.state.requester_comment} receipt={this.state.receipt} errorNodes={this.state.errorNodes} handleFormChange={this.handleBackfillRequestFormChange} handleFileChange={this.handleBackfillRequestFileChange} getValidationState={this.getBackfillRequestValidationState} />
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={this.props.onHide}>Cancel</Button>
            <Button bsStyle="info" bsSize="small" onClick={this.createBackfillRequest}>Request</Button>
          </Modal.Footer>
        </Modal>
      )
    }
  }

})

export default BackfillRequestModal
