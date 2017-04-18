import React, { Component } from 'react'
import $ from "jquery"
import TransactionList from './TransactionList'
import Select from 'react-select'
import Paginator from '../../Paginator'
import { Grid, Row, Col, Button, Glyphicon, Panel, Form, FormGroup,
         ControlLabel, FormControl, Well, Pagination, Table, Label,
         OverlayTrigger, Popover, InputGroup } from 'react-bootstrap'
import CreateTransactionsContainer from './CreateTransactionsContainer'


const TransactionsContainer = React.createClass({
  getInitialState() {
    return {
      transactions:[],

      category: 'All',
      itemSearch: "",

      page: 1,
      pageCount: 0,

      options: [
                { value: 'Acquisition', label: 'Acquisition' },
                { value: 'Loss', label: 'Loss' },
                { value: 'All', label: 'All' }
              ],

      itemsPerPage: 10
    }
  },

  componentWillMount() {
    this.getTransactions()
  },

  getTransactions(){
    var params = {
      category: this.state.category,
      item: this.state.itemSearch,
      page: this.state.page,
      itemsPerPage: this.state.itemsPerPage
    };
    var _this = this;
    $.getJSON("/api/transactions/", params, function(data){
      _this.setState({
        transactions: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
  },

  updateItemsPerPage(e) {
    var q = Number(e.target.value)
    this.setState({
      itemsPerPage: q
    }, this.getTransactions)
  },

  handlePageSelect(activePage) {
    this.setState({
      page: activePage,
    }, this.getTransactions)
  },

  handleCategoryChange(category) {
    if (category == null) {
      this.setState({
        category: "",
        page: 1
      }, this.getTransactions)
    } else {
      this.setState({
        category: category.value,
        page: 1
      }, this.getTransactions)
    }
  },

  handleItemSearch(e) {
    this.setState({
      itemSearch: e.target.value,
      page: 1
    }, this.getTransactions)
  },

  getTransactionFilterPanel() {
    return (
      <div className="panel panel-default">

        <div className="panel-heading">
          <span style={{fontSize:"15px"}}>Refine Results</span>
        </div>

        <div className="panel-body">
          <FormGroup>
            <ControlLabel>Search by item name</ControlLabel>
            <InputGroup bsSize="small">
              <FormControl placeholder="Item name"
                           style={{fontSize:"12px"}}
                           type="text" name="itemSearch"
                           value={this.state.itemSearch}
                           onChange={this.handleItemSearch}/>
              <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.handleSearch}>
                <Glyphicon glyph="search"/>
              </InputGroup.Addon>
            </InputGroup>
          </FormGroup>
          <FormGroup>
            <ControlLabel>Type of Request</ControlLabel>
            <Select style={{fontSize:"12px"}} name="transactions-category-filter"
                    multi={false}
                    placeholder="Filter by type"
                    value={this.state.category}
                    options={[
                      {
                        label: "Acquisition",
                        value: "Acquisition",
                      },
                      {
                        label: "Loss",
                        value: "Loss"
                      }
                    ]}
                    onChange={this.handleCategoryChange} />
          </FormGroup>
        </div>

      </div>
    )
  },

  getTransactionAssetsPopover(tx) {
    var content = (tx.assets.length > 0) ? (
      tx.assets.join(", ")
    ) : (
      "N/A"
    )
    return (
      <Popover style={{maxWidth:"200px"}} id="tag-popover" >
        <Col sm={12}>
          <div style={{fontSize:"10px"}}>
            <p style={{marginBottom: "2px"}}>{content}</p>
          </div>
        </Col>
      </Popover>
    )
  },

  getTransactionPanel() {
    var transactionsTable = null
    if (this.state.transactions.length > 0) {
      transactionsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Category</th>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Asset Tags</th>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Administrator</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-left">Comment</th>
            </tr>
          </thead>
          <tbody>
            { this.state.transactions.map( (transaction, i) => {
              var label = (transaction.category == "Acquisition") ? (
                <Label bsSize="small" bsStyle="success">Acquisition</Label>
              ) : (
                <Label bsSize="small" bsStyle="danger">Loss</Label>
              )
              return (
                <tr key={transaction.id}>
                  <td data-th="ID" className="text-center" >
                    { transaction.id }
                  </td>
                  <td data-th="Item" className="text-left" >
                    <a href={"/app/inventory/" + transaction.item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                      { transaction.item }
                    </a>
                  </td>
                  <td data-th="Category" className="text-center" >
                    { label }
                  </td>
                  <td data-th="Quantity" className="text-center" >
                    <span style={{fontSize:"11px"}}>{transaction.quantity}</span>
                  </td>
                  <td data-th="Asset Tags" className="text-center" >
                    <OverlayTrigger rootClose trigger={["hover", "focus"]} placement="right" overlay={this.getTransactionAssetsPopover(transaction)}>
                      <Glyphicon glyph="tags" className="clickable"/>
                    </OverlayTrigger>
                  </td>
                  <td data-th="Administrator" className="text-center" >
                    <span style={{color: "#df691a"}}>{transaction.administrator}</span>
                  </td>
                  <td data-th="Date" className="text-center" >
                    <span style={{fontSize:"11px"}}>{new Date(transaction.date).toLocaleString()}</span>
                  </td>
                  <td data-th="Comment" className="text-left" >
                    <span style={{fontSize:"11px"}}>{transaction.comment}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    } else {
      transactionsTable = (
        <Well bsSize="small" style={{marginBottom: "0px", fontSize: "12px"}} className="text-center">
          There have not been any acquisitions or losses of this item.
        </Well>
      )
    }
    return (
      <div className="panel panel-default">

        <div className="panel-heading">
          <Row>
            <Col xs={12} >
              <span className="panel-title" style={{fontSize:"15px"}}>View Acquisitions and Losses</span>
              <span style={{float: "right"}}>
                <CreateTransactionsContainer handleTransactionCreated={this.getTransactions} />
              </span>
            </Col>
          </Row>
        </div>

        <div className="panel-body">
          { transactionsTable }
        </div>

        <div className="panel-footer" >
          <Row>
            <Col xs={3}>
              <Form horizontal>
                <FormGroup bsSize="small">
                  <Col xs={7} componentClass={ControlLabel}>
                    Items per page:
                  </Col>
                  <Col xs={5}>
                    <FormControl componentClass="select"
                                 name="itemsPerPage"
                                 style={{fontSize:"12px"}}
                                 value={this.state.itemsPerPage}
                                 onChange={this.updateItemsPerPage}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                      <option value="250">250</option>
                    </FormControl>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
            <Col xs={9}>
              <Pagination next prev maxButtons={10} boundaryLinks
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.pageCount}
                          activePage={this.state.page}
                          onSelect={this.handlePageSelect}/>
            </Col>
          </Row>
        </div>

      </div>
    )
  },


  render() {
    return (
      <Grid>
        <Row>
          <Col sm={12}>
            <h3>Acquisitions and Losses</h3>
            <hr />
          </Col>
        </Row>

        <Row>
          <Col xs={3}>
            { this.getTransactionFilterPanel() }
          </Col>

          <Col xs={9}>
            { this.getTransactionPanel() }
          </Col>
        </Row>

      </Grid>
    );
  }

})


export default TransactionsContainer
