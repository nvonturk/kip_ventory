import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Badge, ListGroup, ListGroupItem } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'
import LoanModal from '../../loans/LoanModal'

import ManagerLoanPanel from './ManagerLoanPanel'

const ManagerLoansContainer = React.createClass({
  getInitialState() {
    return {
      loanGroups: [],

      expandedLoanGroup: null,

      page: 1,
      itemsPerPage: 5,
      pageCount: 1,

      itemSearch: "",
      userSearch: "",
      status: "",
    }
  },

  componentWillMount() {
    this.getLoanGroups();
  },

  getLoanGroups() {
    var url = "/api/loans/all/"
    var params = {
      page: this.state.page,
      itemsPerPage: this.state.itemsPerPage,
      item: this.state.itemSearch,
      user: this.state.userSearch,
      status: this.state.status
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        loanGroups: data.results,
        pageCount: Number(data.num_pages)
      })
    })
  },

  handleItemSearch(e) {
    this.setState({
      itemSearch: e.target.value
    }, this.getLoanGroups)
  },

  handleUserSearch(e) {
    this.setState({
      userSearch: e.target.value
    }, this.getLoanGroups)
  },

  handlePageSelect(activeKey) {
    this.setState({
      page: activeKey
    }, this.getLoanGroups)
  },

  handleStatusSelect(status) {
    if (status == null) {
      this.setState({
        status: ""
      }, this.getLoanGroups)
    } else {
      this.setState({
        status: status.value
      }, this.getLoanGroups)
    }
  },

  handleLoanGroupExpand(index) {
    console.log(index)
    var cur = this.state.expandedLoanGroup
    if (cur == index) {
      this.setState({
        expandedLoanGroup: null
      })
    } else {
      this.setState({
        expandedLoanGroup: index
      })
    }
  },

  getLoanGroupListing() {
    return (this.state.loanGroups.length > 0) ? (
      <ListGroup style={{margin: "0px"}}>
        { this.state.loanGroups.map( (lg, i) => {
          return (
            <ManagerLoanPanel getLoanGroups={this.getLoanGroups}
                              toggleExpanded={this.handleLoanGroupExpand.bind(this, i)}
                              index={i} expanded={this.state.expandedLoanGroup}
                              key={lg.request.request_id} loanGroup={lg} />
          )
        })}
      </ListGroup>
      // <Table condensed hover style={{marginBottom: "0px"}}>
      //   <thead>
      //     <tr style={{borderBottom: "1px solid white"}}>
      //       <th style={{width: "35%"}} className="text-left">Item</th>
      //       <th style={{width: "15%"}} className="text-center">Request</th>
      //       <th style={{width: "15%"}} className="text-center">Type</th>
      //       <th style={{width: "10%"}} className="text-center">Quantity</th>
      //       <th style={{width: "25%"}} className="text-center">Modify</th>
      //     </tr>
      //   </thead>
      //   <tbody>
      //     { this.state.loanGroups.map( (lg, i) => {
      //       return (
      //         <tr key={lg.id}>
      //           <td data-th="Item" className="text-left">
      //             <h6 style={{color: "#df691a"}}>{ lg.item.name }</h6>
      //           </td>
      //           <td data-th="Request" className="text-center">
      //             <span className="clickable"
      //                   style={{color: "#5bc0de", fontSize: "12px", textDecoration: "underline"}}
      //                   onClick={e => {browserHistory.push("/app/requests/" + lg.request.request_id + "/")}}>
      //               View Request
      //             </span>
      //           </td>
      //           <td data-th="Type" className="text-center">
      //             Loan
      //           </td>
      //           <td data-th="Quantity" className="text-center">
      //             Loan
      //           </td>
      //
      //         </tr>
      //       )
      //     })}
      //   </tbody>
      // </Table>
    ) : (
      <Grid fluid>
        <Row>
          <Col xs={12}>
            <br />
            <Well className="text-center" bsSize="small" style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
              No results.
            </Well>
          </Col>
        </Row>
      </Grid>
    )
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <Row >
              <Col md={12}>
                <h3>Manage Loans and Disbursements</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col md={3} xs={12}>
                <div className="panel panel-default">

                  <div className="panel-heading">
                    <span style={{fontSize:"15px"}}>Refine Results</span>
                  </div>

                  <div className="panel-body">
                    <Row>
                      <Col md={12}>
                        <FormGroup>
                          <ControlLabel>Search by Item Name</ControlLabel>
                          <InputGroup bsSize="small">
                            <FormControl placeholder="Item name"
                                         style={{fontSize:"12px"}}
                                         type="text" name="itemSearch"
                                         value={this.state.itemSearch}
                                         onChange={this.handleItemSearch}/>
                            <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.handleItemSearch}>
                              <Glyphicon glyph="search"/>
                            </InputGroup.Addon>
                          </InputGroup>
                        </FormGroup>

                        <FormGroup>
                          <ControlLabel>Loan Status</ControlLabel>
                          <Select style={{fontSize:"12px"}} name="loan-status-filter"
                                  multi={false}
                                  placeholder="Filter by loan status"
                                  value={this.state.status}
                                  options={[
                                    {
                                      label: "Outstanding",
                                      value: "Outstanding",
                                    },
                                    {
                                      label: "Returned",
                                      value: "Returned"
                                    }
                                  ]}
                                  onChange={this.handleStatusSelect} />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>

                </div>
                <div className="panel panel-default">

                  <div className="panel-heading">
                    <span style={{fontSize:"15px"}}>Legend</span>
                  </div>

                  <div className="panel-body">
                    <Row style={{display: "flex"}}>
                      <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
                        <Glyphicon style={{color: "#5cb85c", fontSize:"18px"}} glyph="ok-circle" />
                      </Col>
                      <Col md={9}>
                        <p style={{marginBottom:"0px", fontSize: "12px"}}>This item has been returned from loan.</p>
                      </Col>
                    </Row>
                    <hr />
                    <Row style={{display: "flex"}}>
                      <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
                        <Glyphicon style={{color: "#d9534f", fontSize:"18px"}} glyph="remove-circle" />
                      </Col>
                      <Col md={9}>
                        <p style={{marginBottom: "0px", fontSize: "12px"}}>This item is still on loan.</p>
                      </Col>
                    </Row>
                    <hr />
                    <Row style={{display: "flex"}}>
                      <Col md={3} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
                        <Glyphicon style={{color: "#f0ad4e", fontSize:"18px"}} glyph="log-out" />
                      </Col>
                      <Col md={9}>
                        <p style={{marginBottom: "0px", fontSize: "12px"}}>This item has been disbursed.</p>
                      </Col>
                    </Row>

                  </div>

                </div>
              </Col>

              <Col md={9} xs={12}>
                <div className="panel panel-default">

                  <div className="panel-heading">
                    <span style={{fontSize:"15px"}}>View All Loans and Disbursements</span>
                    <span style={{float:"right", fontSize:"12px"}}>
                      Loans are grouped by request. &nbsp; Click to expand.
                    </span>
                  </div>

                  <div className="panel-body" style={{padding:"0px", minHeight:"485px"}}>
                    { this.getLoanGroupListing() }
                  </div>

                  <div className="panel-footer">
                    <Row>
                      <Col md={12}>
                        <Pagination next prev maxButtons={10} boundaryLinks ellipsis style={{float:"right", margin: "0px"}} bsSize="small" items={this.state.pageCount} activePage={this.state.page} onSelect={this.handlePageSelect} />
                      </Col>
                    </Row>
                  </div>

                </div>
              </Col>
            </Row>

          </Col>
        </Row>
      </Grid>
    )
  },

})

export default ManagerLoansContainer
