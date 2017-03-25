import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Badge, ListGroup, ListGroupItem } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'
import LoanModal from './LoanModal'

const LoanGroupPanel = React.createClass({

  getInitialState() {
    return {
      showReturnModal: false,
      loanToReturn: null,
      returnQuantity: 1,

      showDisburseModal: false,
      loanToDisburse: null,
      disburseQuantity: 1
    }
  },

  isAllReturned() {
    for (var i=0; i<this.props.loanGroup.loans.length; i++) {
      var loan = this.props.loanGroup.loans[i]
      if (loan.quantity_loaned > loan.quantity_returned) {
        return false
      }
    }
    console.log("Returned!")
    return true
  },

  getExpandChevron() {
    return (this.props.expanded === this.props.index) ? (
      <Glyphicon style={{fontSize:"12px"}} glyph="chevron-up" />
    ) : (
      <Glyphicon style={{fontSize:"12px"}} glyph="chevron-down" />
    )
  },

  getRequestStatusSymbol(fs) {
    return (this.isAllReturned()) ? (
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-circle" />
    ) : (
      <Glyphicon style={{color: "#d9534f", fontSize: fs}} glyph="remove-circle" />
    )
  },

  getLoanStatusSymbol(loan, fs) {
    return (loan.quantity_returned === loan.quantity_loaned) ? (
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-circle" />
    ) : (
      <Glyphicon style={{color: "#d9534f", fontSize: fs}} glyph="remove-circle" />
    )
  },

  getPanelStyle() {
    return (this.props.index === this.props.expanded) ? (
      {margin:"10px 0px", boxShadow: "0px 0px 5px 2px #485563"}
    ) : (
      {margin:"0px"}
    )
  },

  toggleReturnModal(loan, e) {
    console.log(loan)
    this.setState({
      showReturnModal: !this.state.showReturnModal,
      loanToReturn: loan,
      returnQuantity: loan.quantity_loaned - loan.quantity_returned,
    }, () => {console.log(this.state)})
  },

  toggleDisburseModal(loan, e) {
    console.log(loan)
    this.setState({
      showDisburseModal: !this.state.showDisburseModal,
      loanToDisburse: loan,
      disburseQuantity: loan.quantity_loaned - loan.quantity_returned
    })
  },

  handleReturnQuantityChange(e) {
    var q = Number(e.target.value)
    if ((q >= 0) && (q <= this.state.loanToReturn.quantity_loaned - this.state.loanToReturn.quantity_returned)) {
      this.setState({
        [e.target.name]: q
      })
    }
  },

  handleDisburseQuantityChange(e) {
    var q = Number(e.target.value)
    console.log(q)
    console.log((this.state.loanToDisburse.quantity_loaned - this.state.loanToDisburse.quantity_returned))
    if ((q >= 0) && (q <= this.state.loanToDisburse.quantity_loaned - this.state.loanToDisburse.quantity_returned)) {
      this.setState({
        [e.target.name]: q
      })
    }
  },

  handleReturn(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/loans/" + this.state.loanToReturn.id + "/"
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
          returnQuantity: 1,
          showReturnModal: false,
        }, _this.props.getLoanGroups)
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
    var url = "/api/loans/" + this.state.loanToDisburse.id + "/convert/"
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
          disburseQuantity: 1,
          showDisburseModal: false,
        }, _this.props.getLoanGroups)
      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  getReturnModal() {
    return (this.state.loanToReturn !== null) ? (
      <Modal show={this.state.showReturnModal} onHide={e => {this.setState({showReturnModal: false})}}>
        <Modal.Header closeButton>
          <Modal.Title>Initiate Return</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12}>
              <p style={{fontSize: "12px"}}>
                Use this form to log the return of item instances.
              </p>
              <hr />
            </Col>
          </Row>
          <Row>
            <Col xs={6}>
              <Form horizontal>
                <FormGroup bsSize="small">
                  <Col xs={6} componentClass={ControlLabel}>
                    Quantity to Return
                  </Col>
                  <Col xs={5}>
                    <FormControl type="number" name="returnQuantity" value={this.state.returnQuantity}
                                 onChange={this.handleReturnQuantityChange} min={1} step={1} />
                  </Col>
                </FormGroup>
              </Form>
            </Col>
            <Col xs={6}>
              <Table condensed>
                <tbody>
                  <tr>
                    <th style={{paddingRight:"15px", verticalAlign: "middle", }}>Name:</th>
                    <td >{this.state.loanToReturn.item.name}</td>
                  </tr>

                  <tr>
                    <th style={{paddingRight:"15px", verticalAlign: "middle", }}>In Stock:</th>
                    <td >{this.state.loanToReturn.item.quantity} instance(s)</td>
                  </tr>

                  <tr>
                    <th style={{paddingRight:"15px", verticalAlign: "middle", }}>Outstanding Instances:</th>
                    <td style={{color: "rgb(223, 105, 26)"}}>{this.state.loanToReturn.quantity_loaned - this.state.loanToReturn.quantity_returned} instance(s)</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <span style={{float:"right"}}>
            <Col xs={6}>
              <Button type="submit" bsSize="small" bsStyle="default" style={{float:"right",fontSize:"10px"}} onClick={e => {this.setState({returnQuantity: 1, showReturnModal: false})}}>
                Cancel
              </Button>
            </Col>
            <Col xs={6}>
              <Button type="submit" bsSize="small" bsStyle="info" style={{float:"right",fontSize:"10px"}}
                      onClick={this.handleReturn} disabled={this.state.returnQuantity === 0}>
                Return Instances
              </Button>
            </Col>
          </span>
        </Modal.Footer>
      </Modal>
    ) : null
  },

  getDisburseModal() {
    return (this.state.loanToDisburse !== null) ? (
      <Modal show={this.state.showDisburseModal} onHide={e => {this.setState({showDisburseModal: false})}}>
        <Modal.Header closeButton>
          <Modal.Title>Convert to Disbursement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12}>
              <p style={{fontSize: "12px"}}>
                Use this form to convert a loan to a disbursement.
              </p>
              <hr />
            </Col>
          </Row>
          <Row>
            <Col xs={6}>
              <Form horizontal>
                <FormGroup bsSize="small">
                  <Col xs={6} componentClass={ControlLabel}>
                    Quantity to Disburse
                  </Col>
                  <Col xs={5}>
                    <FormControl type="number" name="disburseQuantity" value={this.state.disburseQuantity}
                                 onChange={this.handleDisburseQuantityChange} min={1} step={1} />
                  </Col>
                </FormGroup>
              </Form>
            </Col>
            <Col xs={6}>
              <Table condensed>
                <tbody>
                  <tr>
                    <th style={{paddingRight:"15px", verticalAlign: "middle", }}>Name:</th>
                    <td >{this.state.loanToDisburse.item.name}</td>
                  </tr>

                  <tr>
                    <th style={{paddingRight:"15px", verticalAlign: "middle", }}>In Stock:</th>
                    <td >{this.state.loanToDisburse.item.quantity} instance(s)</td>
                  </tr>

                  <tr>
                    <th style={{paddingRight:"15px", verticalAlign: "middle", }}>Outstanding Instances:</th>
                    <td style={{color: "rgb(223, 105, 26)"}}>{this.state.loanToDisburse.quantity_loaned - this.state.loanToDisburse.quantity_returned} instance(s)</td>
                  </tr>
                </tbody>
              </Table>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <span style={{float:"right"}}>
            <Col xs={6}>
              <Button type="submit" bsSize="small" bsStyle="default" style={{float:"right",fontSize:"10px"}} onClick={e => {this.setState({disburseQuantity: 1, showDisburseModal: false})}}>
                Cancel
              </Button>
            </Col>
            <Col xs={6}>
              <Button type="submit" bsSize="small" bsStyle="info" style={{float:"right",fontSize:"10px"}}
                      onClick={this.handleDisbursement} disabled={this.state.disburseQuantity === 0}>
                Disburse Instances
              </Button>
            </Col>
          </span>
        </Modal.Footer>
      </Modal>
    ) : null
  },

  getLoansCard(loans, request) {
    console.log(loans)
    return (loans.length > 0) ? (
      <Table style={{marginBottom: "0px"}}>
        <thead>
          <tr>
            <th style={{width:"25%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
            <th style={{width:"15%", borderBottom: "1px solid #596a7b"}} className="text-center">Outstanding</th>
            <th style={{width:"10%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
            <th style={{width:"25%", borderBottom: "1px solid #596a7b"}} className="text-center"></th>
            <th style={{width:"25%", borderBottom: "1px solid #596a7b"}} className="text-center"></th>
          </tr>
        </thead>
        <tbody>
          { loans.map( (loan, i) => {
            return (
              <tr key={loan.id}>
                <td data-th="Item" className="text-left">
                  <a href={"/app/inventory/" + loan.item.name + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                    { loan.item.name }
                  </a>
                </td>
                <td data-th="Outstanding" className="text-center">
                  <span style={{fontSize: "12px"}}>
                    { loan.quantity_loaned - loan.quantity_returned }
                  </span>
                </td>
                <td data-th="Status" className="text-center">
                  { this.getLoanStatusSymbol(loan, "15px") }
                </td>
                <td data-th="Return" className="text-center">
                  <Button bsSize="small" bsStyle="info" style={{fontSize: "10px"}}
                          onClick={this.toggleReturnModal.bind(this, loan)}
                          disabled={loan.quantity_loaned === loan.quantity_returned}>
                    Return Instances
                  </Button>
                </td>
                <td data-th="Return" className="text-center">
                  <Button bsSize="small" bsStyle="danger" style={{fontSize: "10px"}}
                          onClick={this.toggleDisburseModal.bind(this, loan)}
                          disabled={loan.quantity_loaned === loan.quantity_returned}>
                    Disburse Instances
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <Well bsSize="small" style={{fontSize: "12px"}} className="text-center">
        All loans in this request have been disbursed to <span style={{color: "rgb(223, 105, 26)"}}>{request.requester}</span>
      </Well>
    )
  },

  render() {
    var request = this.props.loanGroup.request
    var loans = this.props.loanGroup.loans
    return (
      <ListGroupItem style={{borderTop: "2px solid #485563", borderBottom: "2px solid #485563"}}>

        <Row className="clickable" onClick={this.props.toggleExpanded} style={{display: "flex"}}>
          <Col xs={1} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            { this.getRequestStatusSymbol("18px") }
          </Col>
          <Col xs={4} style={{paddingLeft: "0px"}}>
            <div style={{padding: "10px 0px", fontSize:"15px", color: "#df691a"}}>Request #{request.request_id}</div>
            <p style={{fontSize: "12px"}}>Date Requested: &nbsp; &nbsp; {new Date(request.date_open).toLocaleString()}</p>
          </Col>
          <Col xs={6}>

          </Col>
          <Col xs={1} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            { this.getExpandChevron() }
          </Col>
        </Row>

        <Row>
          <Col md={5} xs={12} >
            <Panel style={ this.getPanelStyle() } collapsible defaultExpanded={false} expanded={this.props.expanded === this.props.index}>
              <h5>Request Details</h5>
              <hr style={{marginTop: "0px"}}/>
              <Table condensed>
                <tbody>
                  <tr>
                    <th style={{width:"40%", verticalAlign:"middle"}}>Date Requested:</th>
                    <td style={{width:"60%", verticalAlign:"middle"}}>{new Date(request.date_open).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th style={{width:"40%", verticalAlign:"middle"}}>Justification</th>
                    <td style={{width:"60%", verticalAlign:"middle"}}>{request.open_comment}</td>
                  </tr>
                  <tr>
                    <th style={{width:"40%", verticalAlign:"middle"}}>Date Approved:</th>
                    <td style={{width:"60%", verticalAlign:"middle"}}>{new Date(request.date_closed).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <th style={{width:"40%", verticalAlign:"middle"}}>Admin Comments</th>
                    <td style={{width:"60%", verticalAlign:"middle"}}>{request.closed_comment}</td>
                  </tr>
                </tbody>
              </Table>
            </Panel>
          </Col>

          <Col md={7} xs={12} >
            <Panel style={ this.getPanelStyle() } collapsible defaultExpanded={false} expanded={this.props.expanded === this.props.index}>
              <h5>Loans</h5>
              <hr style={{marginTop: "0px"}}/>
              { this.getLoansCard(loans, request) }
            </Panel>
          </Col>
        </Row>

        { this.getReturnModal() }
        { this.getDisburseModal() }

      </ListGroupItem>
    );
  }
});


export default LoanGroupPanel
