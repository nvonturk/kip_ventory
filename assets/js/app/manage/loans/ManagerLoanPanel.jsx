import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Badge, ListGroup, ListGroupItem } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import TabContainer from '../../requests/detail/utils/TabContainer'
import { browserHistory } from 'react-router'
import Select from 'react-select'

const ManagerLoanPanel = React.createClass({

  getInitialState() {
    return {}
  },

  isAllReturned() {
    for (var i=0; i<this.props.loanGroup.loans.length; i++) {
      var loan = this.props.loanGroup.loans[i]
      if (loan.quantity_loaned > loan.quantity_returned) {
        return false
      }
    }
    for (var i=0; i<this.props.loanGroup.backfills.length; i++) {
      var backfill = this.props.loanGroup.backfills[i]
      if (backfill.status != "Satisfied") {
        return false
      }
    }
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
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-sign" />
    ) : (
      <Glyphicon style={{color: "#f0ad4e", fontSize:"18px"}} glyph="exclamation-sign" />
    )
  },

  getRequestSubtitle() {
    return (this.isAllReturned()) ? (
      "All items in this request have been disbursed or returned to the inventory."
    ) : (
      "One or more items in this request are still on loan."
    )
  },

  render() {
    var request = this.props.loanGroup.request
    var loans = this.props.loanGroup.loans
    var disbursements = this.props.loanGroup.disbursements
    return (
      <ListGroupItem style={{borderTop: "2px solid #485563", borderBottom: "2px solid #485563"}}>

        <Row className="clickable" onClick={this.props.toggleExpanded} style={{display: "flex"}}>
          <Col xs={1} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            { this.getRequestStatusSymbol("18px") }
          </Col>
          <Col xs={3} style={{paddingLeft: "0px"}}>
            <div style={{padding: "5px 0px", fontSize:"15px"}}>
              <span style={{fontSize:"15px"}}>Request #{request.id}</span>
            </div>
            <a style={{fontSize:"12px"}} href={"/app/requests/" + request.id + "/"} onClick={e => {e.stopPropagation()}}>Click to view request</a>
            <p style={{fontSize: "12px"}}>Requested by: <span style={{color:"#df691a"}}>{ request.requester }</span></p>
          </Col>
          <Col xs={7} style={{display: "flex", flexDirection:"column", justifyContent: "center"}}>
            <span style={{fontSize:"12px", float: "right"}}>
              { this.getRequestSubtitle() }
            </span>
          </Col>
          <Col xs={1} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            { this.getExpandChevron() }
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <TabContainer user={this.props.user}
                          request={request}
                          showHeader={false}
                          index={this.props.index}
                          expanded={this.props.expanded}/>
          </Col>
        </Row>

      </ListGroupItem>
    );
  }
});

export default ManagerLoanPanel
