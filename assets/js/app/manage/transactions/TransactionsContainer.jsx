import React, { Component } from 'react'
import $ from "jquery"
import TransactionList from './TransactionList'
import Select from 'react-select'
import Paginator from '../../Paginator'
import { Grid, Row, Col, Button, Glyphicon, Panel, Form, FormGroup, ControlLabel, FormControl, Well, Pagination, Table, Label } from 'react-bootstrap'
import CreateTransactionsContainer from './CreateTransactionsContainer'

const TRANSACTIONS_PER_PAGE = 10;


const TransactionsContainer = React.createClass({
  getInitialState() {
    return {
      transactions:[],
      category: 'All',
      page: 1,
      pageCount: 0,

      options: [
                { value: 'Acquisition', label: 'Acquisition' },
                { value: 'Loss', label: 'Loss' },
                { value: 'All', label: 'All' }
               ]
    }
  },

  componentWillMount() {
    this.getTransactions()
  },

  getTransactions(){
    var params = {
      category: this.state.category,
      page: this.state.page,
      itemsPerPage: TRANSACTIONS_PER_PAGE
    };
    var _this = this;
    $.getJSON("/api/transactions/", params, function(data){
      _this.setState({
        transactions: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
  },

  handlePageSelect(activePage) {
    this.setState({
      page: activePage,
    })
  },

  handleCategoryChange(category) {
    if (category == null) {
      this.setState({
        category: "",
      }, this.getTransactions)
    } else {
      this.setState({
        category: category.value
      }, this.getTransactions)
    }
  },

  getTransactionFilterPanel() {
    return (

      <div className="panel panel-default">

        <div className="panel-heading">
          <span style={{fontSize:"15px"}}>Refine Results</span>
        </div>

        <div className="panel-body">
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

  getTransactionPanel() {
    var transactionsTable = null
    if (this.state.transactions.length > 0) {
      transactionsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">ID</th>
              <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-left">Item</th>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Category</th>
              <th style={{width: "5%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date</th>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Administrator</th>
              <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-left">Comment</th>
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
                  <td data-th="Date" className="text-center" >
                    <span style={{fontSize:"11px"}}>{new Date(transaction.date).toLocaleString()}</span>
                  </td>
                  <td data-th="Administrator" className="text-center" >
                    <span style={{color: "#df691a"}}>{transaction.administrator}</span>
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
            <Col md={12}>
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

// class TransactionsContainer extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       transactions:[],
//       category: 'All',
//       page: 1,
//       pageCount: 0,
//     };
//
//     this.options = [
//                 { value: 'Acquisition', label: 'Acquisition' },
//                 { value: 'Loss', label: 'Loss' },
//                 { value: 'All', label: 'All' }
//             ];
//     this.placeholder = "Filter";
//     this.handleFilterChange = this.handleFilterChange.bind(this);
//     this.handlePageClick = this.handlePageClick.bind(this);
//     this.showCreateTransactionForm = this.showCreateTransactionForm.bind(this);
//     this.getTransactions = this.getTransactions.bind(this);
//
//     this.getTransactions();
//   }
//
//
//   // Only used for initial get
  // getTransactions(){
  //   var params = {
  //     category: this.state.filter_option,
  //     page: this.state.page,
  //     itemsPerPage: TRANSACTIONS_PER_PAGE
  //   };
  //
  //   var thisObj = this;
  //   $.getJSON("/api/transactions/", params, function(data){
  //     thisObj.setState({
  //       transactions: data.results,
  //       pageCount: Math.ceil(data.num_pages),
  //     });
  //   });
  // }
//
//   handlePageClick(data) {
//     let selected = data.selected;
//     let offset = Math.ceil(selected * TRANSACTIONS_PER_PAGE);
//     let page = data.selected + 1;
//
//     this.setState({page: page}, () => {
//       this.getTransactions();
//     });
//   }
//
//
//   handleFilterChange(type) {
//     this.setState({
//       filter_option : type.value,
//       page: 1
//     }, this.getTransactions);
//   }
//
//   showCreateTransactionForm() {
//     this.setState({
//       showCreateTransactionForm: true
//     })
//   }
//
//   render() {
//     return (
//       <Grid fluid>
//         <Row>
//           <Col sm={12}>
//             <h3 style={{display:"inline-block"}}>Acquisitions and Losses</h3>
//             <hr />
//           </Col>
//         </Row>
//         <p>View Acquisitions and Losses or Log a new one.</p>
//         <CreateTransactionsContainer handleTransactionCreated={this.getTransactions} />
//         <Select value={this.state.filter_option} placeholder={this.placeholder} options={this.options} onChange={this.handleFilterChange} clearable={false}/>
//         <TransactionList transactions={this.state.transactions} />
//         <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
//       </Grid>
//     );
//   }
// }


export default TransactionsContainer
