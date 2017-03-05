import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, FormGroup, FormControl, ControlLabel, Panel, Label }  from 'react-bootstrap'
import RequestList from '../RequestList'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from './CreateTransactionsContainer'
import ItemModificationModal from './ItemModificationModal'
import _ from 'underscore'
import {browserHistory} from 'react-router'


const ItemDetail = React.createClass({

  getInitialState() {
    return {
      requests: [],
      transactions: [],
      item: null,
      quantity: 0,
      showModifyButton: this.props.route.user.is_staff,
      showModifyModal: false,
    }
  },

  componentWillMount() {
    this.getItem();
    this.getOutstandingRequests();
    this.getTransactions();
  },

  getItem() {
    var url = "/api/items/" + this.props.params.item_name + "/";
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        item: data
      })
    })
  },

  getOutstandingRequests() {
    var url = "/api/items/" + this.props.params.item_name + "/requests/";
    var params = {all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results.filter( (request) => {
          return (request.status == 'O')
        })
      })
    })
  },

  getTransactions() {
    var url = "/api/transactions/"
    var params = {all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        transactions: data.results.filter( (transaction) => {
          return (transaction.item == _this.props.params.item_name)
        })
      })
    })
  },

  getItemInformation() {
    var ModifyButton = React.createClass({
      render: function() {
        return (
          <Button bsStyle="info" onClick={this.props.click}>Modify</Button>
        );
      }
    });

    return (
      <Panel style={{fontSize: "12px"}}>
        <div>
          <Row>
            <Col sm={6}>
              <h4>Item Information</h4>
            </Col>
            <Col sm={4} smOffset={2}>
            {this.state.showModifyButton ? (
                <ModifyButton click={this.handleModifyClick} />
              ) : null
            }
            </Col>
          </Row>
          <hr />
        </div>

        <Row>
          <Col sm={6}>
            <p>Name :</p>
          </Col>
          <Col sm={6}>
            <p>{this.props.params.item_name}</p>
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            <p>Model number :</p>
          </Col>
          <Col sm={6}>
            <p>{this.state.item.model_no}</p>
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            <p>Quantity :</p>
          </Col>
          <Col sm={6}>
            <p>{this.state.item.quantity}</p>
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            <p>Description :</p>
          </Col>
          <Col sm={6}>
            <p>{this.state.item.description}</p>
          </Col>
        </Row>

        <Row>
          <Col sm={6}>
            Tags :
          </Col>
          <Col sm={6}>
            {this.state.item.tags.join(", ")}
          </Col>
        </Row>

      </Panel>
    )
  },


  getCustomFields() {
    return (
      <Panel style={{fontSize: "12px"}}>
        <div>
          <h4>Custom Fields</h4>
          <hr />
        </div>

        {this.state.item.custom_fields.map( (field, i) => {
          return (
            <Row key={field.name}>
              <Col sm={6}>
                <p>{field.name} :</p>
              </Col>
              <Col sm={6}>
                <p>{field.value}</p>
              </Col>
            </Row>
          )
        })}

      </Panel>
    )
  },

  getCategoryLabel(category) {
    if (category == 'Acquisition') {
      return (<Label bsStyle="success" bsSize="small">Acquisition</Label>)
    } else if (category == "Loss") {
      return (<Label bsStyle="danger" bsSize="small">Loss</Label>)
    } else {
      return null
    }
  },


  getTransactionList() {
    var createTransactionView = "";
    if(this.props.route.user.is_staff) {
      createTransactionView =
          <CreateTransactionsContainer item_name={this.props.params.item_name} handleTransactionCreated={() => {this.getTransactions(); this.getItem();}}/>
    }

    return (
      <Panel style={{fontSize: "12px"}}>
        <div>
          <Row>
            <Col sm={6}>
              <h4>Transactions</h4>
            </Col>
            <Col sm={3} smOffset={3}>
              {createTransactionView}
            </Col>
          </Row>
          <hr />
        </div>

        <Table>
          <thead>
            <tr>
              <th style={{width: "15%"}} className="text-left">Item</th>
              <th style={{width: "15%"}} className="text-left">Administrator</th>
              <th style={{width: "15%"}} className="text-left">Date</th>
              <th style={{width: "25%"}} className="text-left">Comment</th>
              <th style={{width: "15%"}} className="text-center">Category</th>
              <th style={{width: "15%"}} className="text-center">Quantity</th>
            </tr>
          </thead>
          <tbody>
            { this.state.transactions.map( (transaction, i) => {
              return (
                <tr key={transaction.id}>
                  <td data-th="Item" className="text-left">{transaction.item}</td>
                  <td data-th="Administrator" className="text-left">{transaction.administrator}</td>
                  <td data-th="Date" className="text-left">{new Date(transaction.date).toLocaleString()}</td>
                  <td data-th="Comment" className="text-left">{transaction.comment}</td>
                  <td data-th="Category" className="text-center">{this.getCategoryLabel(transaction.category)}</td>
                  <td data-th="Quantity" className="text-center">{transaction.quantity}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Panel>
    )
  },

  getRequestList() {
    return (
      <Panel style={{fontSize: "12px"}}>
        <div>
          <h4>Outstanding Requests</h4>
          <hr />
        </div>

        <Table condensed hover >
          <thead>
            <tr>
              <th style={{width: "15%"}} className="text-left">Requester</th>
              <th style={{width: "20%"}} className="text-left">Date Open</th>
              <th style={{width: "40%"}} className="text-left">Comment</th>
              <th style={{width: "13%"}} className="text-center">Status</th>
              <th style={{width: "12%"}} className="text-center"></th>
            </tr>
          </thead>
          <tbody>
            {this.state.requests.map( (request, i) => {
              var d = new Date(request.date_open)
              return (
                <tr key={request.request_id} style={{height: '50px'}}>
                  <td data-th="Requester" className="text-left">{request.requester}</td>
                  <td data-th="Date Open" className="text-left">{d.toLocaleString()}</td>
                  <td data-th="Comment" className="text-left"><div style={{maxHeight: '100px', overflow: 'auto'}}>{request.open_comment}</div></td>
                  <td data-th="Status" className="text-center">{this.getStatusLabel(request.status)}</td>
                  <td style={{width: "12%"}} className="text-center">
                      <Button bsSize="small" bsStyle="info" onClick={e => this.viewRequest(request)}>View</Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Panel>
    )
  },

  viewRequest(request) {
    browserHistory.push("/app/requests/" + request.request_id);
  },

  getStatusLabel(status) {
    if (status == "A") {
      return (<Label bsStyle='success'>Approved</Label>)
    } else if (status == "D") {
      return (<Label bsStyle='danger'>Denied</Label>)
    } else if (status == "O") {
      return (<Label bsStyle='warning'>Outstanding</Label>)
    }
    else {
      return null
    }
  },

  getAddToCartForm() {
    return (
      <Panel style={{fontSize: "12px"}}>
        <div>
          <h4>Add to Cart</h4>
          <hr />
        </div>

        <Form horizontal onSubmit={e => e.preventDefault()}>

          <FormGroup bsSize="small">
            <Col componentClass={ControlLabel} sm={2}>
              Quantity
            </Col>
            <Col sm={4}>
              <FormControl type="number" min={0} step={1} max={this.state.item.quantity} value={this.state.quantity} name="quantity" onChange={this.onChange} />
            </Col>
            <Col sm={4} smOffset={2}>
              <Button block bsStyle="info" bsSize="small" onClick={this.addToCart}>Add to Cart</Button>
            </Col>
          </FormGroup>

        </Form>

      </Panel>
    )
  },

  onChange(e) {
    e.preventDefault();
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  handleModifyClick(event){
    event.preventDefault();
    this.setState({showModifyModal: true})
  },

  deleteItem(){
    if(confirm("Are you sure you wish to continue?") == true){
      var thisobj = this
      ajax({
      url:"/api/items/" + thisobj.item_name + "/",
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var url = "/app/"
        browserHistory.push(url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");
      }
      });
    } else{

    }
  },

  addToCart(){
    if ((!Number.isInteger(parseInt(this.state.quantity, 10))) || (this.state.quantity <= 0)){
      alert("Quantity must be a positive integer")
    }
    else if(this.state.item.quantity < this.state.quantity){
      alert("Quantity Exceeds Inventory Capacity")
    }
    else{
      var thisobj = this;
      ajax({
        url:"/api/items/" + thisobj.state.item.name + "/addtocart/",
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        data: {
          quantity: thisobj.state.quantity
        },
        success:function(response){
          //reset form
          thisobj.setState({quantity:0})
        },
        complete:function(){},
        error:function (xhr, textStatus, thrownError){
            alert("error adding item to cart");
        }
      });
    }
  },

  saveChanges(e, state){
    e.preventDefault()
    if(confirm("Are you sure you wish to continue?") == true){
      if ((!Number.isInteger(parseInt(state.quantity, 10))) || (state.quantity <= 0)){
        alert("Quantity must be a positive integer " + (state.quantity <= 0) )
      }
      var thisobj = this
      var custom_fields = state.custom_fields.map( (cf, i) => {return JSON.stringify(cf)} )
      var tags = state.tags

      if( Object.prototype.toString.call( tags ) !== '[object Array]' ) {
        if(tags==""){
          var tagArray = [];
        } else{
          var tagArray = tags.split(",");
        }
      } else{
        var tagArray = tags;
      }

      console.log(tagArray)

      ajax({
        url:"/api/items/" + thisobj.state.item.name + "/",
        type: "PUT",
        traditional: true,
        data: {
          name: state.name,
          model_no: state.model_no,
          description: state.description,
          quantity: state.quantity,
          tags: tagArray,
          custom_fields: custom_fields
        },
        statusCode: {
           400: function() {
             alert("Unsuitable Data");
           }
         },
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        success:function(response){
          if (thisobj.state.item.name !== response.name) {
            var url = "/app/"
            browserHistory.push(url)
          } else {
            thisobj.getItem(thisobj.props.params.item_name)
            thisobj.setState({
              showModifyModal: false
            })
          }
        },
        complete:function(){},
        error:function (xhr, textStatus, thrownError){
          console.log(xhr);
          console.log(textStatus);
          console.log(thrownError);
        }
      });

    } else{

    }
  },

  closeModal(){
    this.setState({showModifyModal: false});
  },

  render() {
    return this.state.item !== null ? (
      <Grid>

        <Col sm={8} smOffset={2}>

          <Row>
            <Col sm={12}>
              <h3>Item Details</h3>
              <hr />
            </Col>
          </Row>

          <Row>
            <Col sm={6}>
              <Row>
                <Col sm={12}>
                  { this.getItemInformation() }
                </Col>
              </Row>
              <Row>
                <Col sm={12}>
                  { this.getAddToCartForm() }
                </Col>
              </Row>
            </Col>
            <Col sm={6}>
              { this.getCustomFields() }
            </Col>
          </Row>


          <Row>
            <Col sm={12}>
              { this.getTransactionList() }
            </Col>
          </Row>

          <Row>
            <Col sm={12}>
              { this.getRequestList() }
            </Col>
          </Row>

        </Col>

        <ItemModificationModal showModal={this.state.showModifyModal}
                               close={this.closeModal}
                               item={this.state.item}
                               deleteItem={this.deleteItem}
                               saveChanges={this.saveChanges}
                               is_admin={this.props.route.user.is_superuser}/>

      </Grid>
    ) : null

  }

})
export default ItemDetail
