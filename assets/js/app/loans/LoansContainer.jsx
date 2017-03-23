import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { browserHistory } from 'react-router'
import Select from 'react-select'
import LoanModal from './LoanModal'

const LoansContainer = React.createClass({
  getInitialState() {
    return {
      loans: [],

      page: 1,
      itemsPerPage: 10,
      pageCount: 1,

      searchText: "",
      status: "",

      showLoanModal: false,
      loanToShow: null
    }
  },

  componentWillMount() {
    this.getLoans();
  },

  getLoans() {
    var url = "/api/loans/"
    var params = {
      page: this.state.page,
      itemsPerPage: this.state.itemsPerPage,
      search: this.state.searchText,
      status: this.state.status
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        loans: data.results,
        pageCount: Number(data.num_pages)
      })
    })
  },

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  handleSearch(e) {
    this.setState({
      searchText: e.target.value
    }, this.getLoans)
  },

  handlePageSelect(activeKey) {
    this.setState({
      page: activeKey
    }, this.getLoans)
  },

  handleStatusSelect(status) {
    if (status == null) {
      this.setState({
        status: ""
      }, this.getLoans)
    } else {
      this.setState({
        status: status.value
      }, this.getLoans)
    }
  },

  showLoan(loan) {
    this.setState({
      showLoanModal: true,
      loanToShow: loan
    })
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <Row >
              <Col md={12}>
                <h3>Your Loans</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col md={3} xs={12}>
                <div className="panel panel-default">

                  <div className="panel-heading">
                    <span style={{fontSize:"15px"}}>Filter Loans</span>
                  </div>

                  <div className="panel-body">
                  <Row>
                    <Col md={12}>
                      <FormGroup>
                        <ControlLabel>Search by Item Name</ControlLabel>
                        <InputGroup bsSize="small">
                          <FormControl placeholder="Item name"
                                       style={{fontSize:"12px"}}
                                       type="text" name="searchText"
                                       value={this.state.searchText}
                                       onChange={this.handleSearch}/>
                          <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.handleSearch}>
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
              </Col>

              <Col md={9} xs={12}>
                <div className="panel panel-default">

                  <div className="panel-heading">
                    <span style={{fontSize:"15px"}}>View Your Loans</span>
                  </div>

                  <div className="panel-body">
                    <Table condensed hover style={{marginBottom: "0px"}}>
                      <thead>
                        <tr>
                          <th style={{width:" 5%"}} className="text-center">ID</th>
                          <th style={{width:"15%"}} className="text-center">Item</th>
                          <th style={{width:"20%"}} className="text-center">Date Loaned</th>
                          <th style={{width:" 5%"}} className="text-center">Request</th>
                          <th style={{width:"25%"}} className="text-center">Admin Comment</th>
                          <th style={{width:" 5%"}} className="text-center">Loaned</th>
                          <th style={{width:" 5%"}} className="text-center">Returned</th>
                          <th style={{width:"10%"}} className="text-center">Status</th>
                          <th style={{width:"10%"}} className="text-center">Loan Details</th>
                        </tr>
                        <tr>
                          <th colSpan={9}>
                            <hr style={{margin: "auto"}} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.loans.map( (loan, i) => {
                          var statusLabel = null
                          if (loan.quantity_returned == loan.quantity_loaned) {
                            statusLabel = <Label bsStyle="success" bsSize="small">Returned</Label>
                          } else {
                            statusLabel = <Label bsStyle="danger" bsSize="small">Outstanding</Label>
                          }
                          return (
                            <tr key={loan.id}>
                              <td data-th="ID" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <span style={{fontSize:"12px"}}>{ loan.id }</span>
                              </td>
                              <td data-th="Item" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <h6 onClick={e => {browserHistory.push("/app/inventory/" + loan.item.name + "/")}} className="clickable" style={{fontSize:"11px", color: "#df691a"}} >{ loan.item.name }</h6>
                              </td>
                              <td data-th="Date Loaned" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <span style={{fontSize:"11px"}}>{ new Date(loan.date_loaned).toLocaleString() }</span>
                              </td>
                              <td data-th="Request" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <a style={{fontSize: "12px", textDecoration: "none", color: "#5bc0de"}} href={"/app/requests/" + loan.request.request_id + "/"}>{loan.request.request_id}</a>
                              </td>
                              <td data-th="Admin Comment" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <span style={{fontSize:"11px"}}>{ loan.request.closed_comment }</span>
                              </td>
                              <td data-th="Loaned" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <span style={{fontSize:"12px"}}>{ loan.quantity_loaned }</span>
                              </td>
                              <td data-th="Returned" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <span style={{fontSize:"12px"}}>{ loan.quantity_returned }</span>
                              </td>
                              <td data-th="Status" className="text-center" style={{border: "1px solid #596a7b"}}>
                                { statusLabel }
                              </td>
                              <td data-th="Loan Details" className="text-center" style={{border: "1px solid #596a7b"}}>
                                <span className="clickable" style={{fontSize: "11px", color: "#5bc0de"}} onClick={e => {this.setState({showLoanModal: true, loanToShow: loan})}}>Click to view</span>
                              </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </Table>
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

            <LoanModal show={this.state.showLoanModal} onHide={e => {this.setState({showLoanModal: false, loanToShow: null})}} loan={this.state.loanToShow} />

          </Col>
        </Row>
      </Grid>
    )
  }

})

export default LoansContainer
