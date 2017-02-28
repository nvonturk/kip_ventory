import React, { Component } from 'react'
import $ from "jquery"
import TransactionList from './TransactionList'
import Select from 'react-select'
import Paginator from '../../Paginator'
import { Grid, Row, Col } from 'react-bootstrap'


const TRANSACTIONS_PER_PAGE = 2;

class TransactionsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions:[],
      all_transactions:[],
      filter_option: 'All',
      page: 1,
      pageCount: 0,

    };

    this.options = [
                { value: 'Acquisition', label: 'Acquisition' },
                { value: 'Loss', label: 'Loss' },
                { value: 'All', label: 'All' }
            ];
    this.placeholder = "Filter";
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);

    this.getTransactions();
  }


  // Only used for initial get
  getTransactions(){
    var params = {
      category: this.state.filter_option,
      page: this.state.page,
      itemsPerPage: TRANSACTIONS_PER_PAGE
    };

    var thisObj = this;
    $.getJSON("/api/transactions/", params, function(data){
      thisObj.setState({
        transactions: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
  }

  handlePageClick(data) {
    let selected = data.selected;
    let offset = Math.ceil(selected * TRANSACTIONS_PER_PAGE);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.getTransactions();
    });
  }


  handleFilterChange(type) {
    this.setState({
      filter_option : type.value,
      page: 1
    }, this.getTransactions);
  }

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col xs={12}>
            <h3>Transactions</h3>
            <hr />
            <p>
              View Item Transcations.
            </p>
            <br />
          </Col>
        </Row>
        <Select value={this.state.filter_option} placeholder={this.placeholder} options={this.options} onChange={this.handleFilterChange} clearable={false}/>
        <TransactionList transactions={this.state.transactions} />
        <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
      </Grid>
    );
  }
}


export default TransactionsContainer
