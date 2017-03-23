import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, FormGroup, FormControl, ControlLabel, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'



const LoansContainer = React.createClass({
  getInitialState() {
    return {
      loans: [],

      page: 1,
      itemsPerPage: 5,
      pageCount: 1,

      itemNames: [],
      loansFilterStatus: "",
      loansFilterItem: ""
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
      status: this.state.loansFilterStatus,
      item: this.state.loansFilterItem
    }
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        loans: data.results,
        pageCount: Number(data.num_pages)
      })
    })
  },

  getItemNames() {
    var url = "/api/items/"

  },

  getUserLoanPanel() {
    var loanTable = null;
    if (this.state.loans.length == 0) {
      loanTable = (
        <p style={{marginBottom:"0px", fontSize: "12px"}}>
          You have no outstanding loans for this item.
        </p>
      )
    } else {
      loanTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
            <th style={{width: "7%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
            <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Loan Date</th>
            <th style={{width: "8%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-left">Justification</th>
            <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Approved by</th>
            <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              return (
                <tr key={loan.id}>
                  <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.id}
                  </td>
                  <td data-th="Loan Date" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(loan.request.date_closed).toLocaleDateString()}
                  </td>
                  <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.quantity}
                  </td>
                  <td data-th="Justification" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.request.open_comment}
                  </td>
                  <td data-th="Approved by" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.request.administrator}
                  </td>
                  <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <a style={{color: "#5bc0de"}} href={"/app/loans/" + loan.id + "/"}>Click to view</a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <Panel header={"Your Approved Loans"}>
        { loanTable }
      </Panel>
    )
  },


  render() {
    if (this.state.itemExists) {
      return (
        <Grid>
          <Row>
          <Col xs={12}>


          </Col>
          </Row>
        </Grid>
      )
    } else {
      return (
        <Grid>
        <Row>
          <Col>
            <h3>404 - Item '{this.props.params.item_name}' not found.</h3>
            <hr />
          </Col>
        </Row>
        </Grid>
      )
    }
  }

})

export default LoansContainer
