import React, { Component } from 'react'
import { ListGroup, ListGroupItem } from 'react-bootstrap'
import Transaction from './transaction'


class TransactionList extends Component {
  constructor(props) {
    super(props);
  };


  render(){
    var list = [];
    this.props.transactions.map(function(transaction, i){
      list.push(<ListGroupItem key={i}><Transaction transaction={transaction}/></ListGroupItem>);
    });
    

    return(
      <ListGroup>
        {list}
      </ListGroup>
    )
  }

}

export default TransactionList
