import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Badge, ListGroup, ListGroupItem } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'

const RequestedItemPanel = React.createClass({

  getInitialState() {
    return {

    }
  },

  getExpandChevron() {
    return (this.props.expanded === this.props.index) ? (
      <Glyphicon style={{fontSize:"12px"}} glyph="chevron-up" />
    ) : (
      <Glyphicon style={{fontSize:"12px"}} glyph="chevron-down" />
    )
  },

  getRequestSubtitle() {
    return (this.isAllReturned()) ? (
      "All items in this request have been disbursed or returned to the inventory."
    ) : (
      "One or more items in this request are still on loan."
    )
  },

  getLoanStatusSymbol(loan, fs) {
    return (loan.quantity_returned === loan.quantity_loaned) ? (
      <Glyphicon style={{color: "#5cb85c", fontSize: fs}} glyph="ok-circle" />
    ) : (
      <Glyphicon style={{color: "#f0ad4e", fontSize: fs}} glyph="exclamation-sign" />
    )
  },

  getPanelStyle() {
    return (this.props.index === this.props.expanded) ? (
      {margin:"10px 0px", boxShadow: "0px 0px 5px 2px #485563"}
    ) : (
      {margin:"0px"}
    )
  },

  render() {
    return (
      <ListGroupItem style={{borderTop: "2px solid #485563", borderBottom: "2px solid #485563"}}>

        <Row className="clickable" onClick={this.props.toggleExpanded} style={{display: "flex"}}>
          <Col xs={11} style={{paddingLeft: "0px"}}>
            <div style={{padding: "10px 0px", fontSize:"14px", color: "#df691a"}}>
              { this.props.requestedItem.item }
            </div>
            <p style={{fontSize: "12px"}}>Quantity Requested: &nbsp; &nbsp; &nbsp; { this.props.requestedItem.quantity }</p>
          </Col>
          <Col xs={1} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            { this.getExpandChevron() }
          </Col>
        </Row>

        <Row>
          <Col md={5} xs={12} >
            <Panel style={ this.getPanelStyle() } collapsible defaultExpanded={false} expanded={this.props.expanded === this.props.index}>
              <span style={{fontSize:"15px", margin: "10.5px 0px"}}>Requested Item</span>
              <hr style={{marginTop: "0px"}}/>
              <Table condensed>
                <tbody>
                  <tr>
                    <th style={{width:"30%", verticalAlign:"middle"}}>Item:</th>
                    <td style={{width:"70%", verticalAlign:"middle"}}>{this.props.requestedItem.item}</td>
                  </tr>
                  <tr>
                    <th style={{width:"30%", verticalAlign:"middle"}}>Requested For:</th>
                    <td style={{width:"70%", verticalAlign:"middle"}}>{this.props.requestedItem.request_type}</td>
                  </tr>
                  <tr>
                    <th style={{width:"30%", verticalAlign:"middle"}}>Quantity:</th>
                    <td style={{width:"70%", verticalAlign:"middle"}}>{this.props.requestedItem.quantity}</td>
                  </tr>
                </tbody>
              </Table>
            </Panel>
          </Col>

          <Col md={7} xs={12} >
            <Panel style={ this.getPanelStyle() } collapsible defaultExpanded={false} expanded={this.props.expanded === this.props.index}>
              <span style={{fontSize:"15px", margin: "10.5px 0px"}}>Select Assets</span>
              <hr style={{marginTop: "0px"}}/>

            </Panel>
          </Col>

        </Row>

      </ListGroupItem>
    );
  }
});

export default RequestedItemPanel
