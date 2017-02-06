import React, { Component } from 'react'
import $ from "jquery"
import TransactionList from './TransactionList'
import Select from 'react-select'

class TransactionsContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions:[],
      all_transactions:[],
      filter_option: 'all',
    };

    this.options = [
                { value: 'Acquisition', label: 'Acquisition' },
                { value: 'Loss', label: 'Loss' },
                { value: 'all', label: 'All' }
            ];
    this.placeholder = "Filter";
    this.handleFilterChange = this.handleFilterChange.bind(this);

    this.getTransactions();
  }


  // Only used for initial get
  getTransactions(){
    var thisObj = this;
    $.getJSON("/api/transactions.json", function(data){
      thisObj.setState({
        all_transactions: data,
        transactions: data
      });
    });
  }

  handleFilterChange(type) {
    this.setState({
      filter_option : type.value,
      transactions: this.filterTransactions(type.value)
    });
  }

  filterTransactions(option){
    var new_transactions;
    if(option == "all"){
      new_transactions = this.state.all_transactions.slice();
    } else{
      new_transactions = this.state.all_transactions.filter(function(transaction){
        return option == transaction.category;
      });
    }
    return new_transactions;
  }

  render() {
    return (
      <div>
        <Select value={this.state.filter_option} placeholder={this.placeholder} options={this.options} onChange={this.handleFilterChange} clearable={false}/>
        <TransactionList transactions={this.state.transactions} />
      </div>
    );
  }
}


export default TransactionsContainer
