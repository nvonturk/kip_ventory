import React, {Component} from 'react'
import { Grid, Row, Col, Button, FormGroup, ControlLabel, FormControl, Panel, Form, Table, Well, Alert } from 'react-bootstrap'
import { getJSON, ajax } from 'jquery'
import SimpleDropdown from '../../SimpleDropdown'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import MultiSelect from '../../MultiSelect'
import Select from 'react-select'
import 'react-select/dist/react-select.css'


const DisbursementContainer = React.createClass({
  getInitialState() {
    return {
      items: [],
      users: [],

      comment: "",
      quantity: 0,
      type: "loan",

      selectedItem: "",
      selectedUser: "",

      selectedItems: [],
      quantities: [],
      types: [],

      showCreatedSuccess: false,
      createdMessage: "",

      showErrorMessage: false,
      errorMessage: ""
    }
  },

  componentWillMount() {
    this.getItems();
    this.getUsers();
  },

  getItems() {
    var url = "/api/items/";
    var params = {all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        items: data.results.map( (item, i) => {return {value: item.name, label: item.name}} )
      })
    })
  },

  getUsers() {
    var url = "/api/users/";
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        users: data.map( (user, i) => {return {value: user.username, label: user.username}} )
      })
    })
  },

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  },

  handleUserSelection(user) {
    this.handleSelection("selectedUser", user, "")
  },

  handleItemSelection(item) {
    this.handleSelection("selectedItem", item, "")
  },

  handleSelection(key, val, defaultVal) {
    if (val == null) {
      this.setState({
        [key]: defaultVal
      })
    } else {
      this.setState({
        [key]: val.value
      })
    }
  },

  removeItemFromDisbursement(index) {
    var items = this.state.items
    var removed_item_name = this.state.selectedItems[index]
    items.push({value: removed_item_name, label: removed_item_name})
    var selectedItems = this.state.selectedItems.filter( (item, i) => {return (i != index)} )
    var quantities = this.state.quantities.filter( (item, i) => {return (i != index)} )
    this.setState({
      selectedItems: selectedItems,
      quantities: quantities,
      items: items
    })
  },

  addItemToDisbursement() {
    var index = this.state.items.map( (item, i) => {return (item.value == this.state.selectedItem)}).indexOf(true);
    var items = this.state.items.filter( (item, i) => { return (i != index) });
    var selectedItems = this.state.selectedItems
    var quantities = this.state.quantities
    var types = this.state.types
    selectedItems.push(this.state.selectedItem)
    quantities.push(this.state.quantity)
    types.push(this.state.type)
    this.setState({
      selectedItem: "",
      quantity: 0,
      items: items,
      selectedItems: selectedItems,
      quantities: quantities,
      type: "loan"
    })
  },

  getSelectedItemList() {
    return (
      <Table condensed hover>
        <thead>
          <tr>
            <th style={{width: "40%"}} className="text-left">Item</th>
            <th style={{width: "25%"}} className="text-center">Type</th>
            <th style={{width: "5%"}} className="spacer"></th>
            <th style={{width: "10%"}} className="text-center">Quantity</th>
            <th style={{width: "5%"}} className="spacer"></th>
            <th style={{width: "15%"}} className="text-center">Remove</th>
          </tr>
        </thead>
        <tbody>
          { this.state.selectedItems.map( (item, i) => {
            return (
              <tr>
                <td data-th="Item" className="text-left">
                  <a href={"/app/inventory/" + item + "/"} style={{fontSize: "12px", color: "rgb(223, 105, 26)"}}>
                    { item }
                  </a>
                </td>
                <td data-th="Type" className="text-center">
                  <span style={{fontSize:"12px"}}>
                    { this.state.types[i] }
                  </span>
                </td>
                <td />
                <td data-th="Quantity" className="text-center">
                  <span style={{fontSize:"12px"}}>
                    { this.state.quantities[i] }
                  </span>
                </td>
                <td />
                <td data-th="Remove" className="text-center">
                  <Button bsStyle="danger" bsSize="small" style={{fontSize:"12px"}} onClick={this.removeItemFromDisbursement.bind(this,i)}>
                    Remove
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    );
  },

  disburse() {
    var items = this.state.selectedItems;
    var quantities = this.state.quantities;
    var _this = this;
    ajax({
      url:"/api/disburse/",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({
        requester: this.state.selectedUser,
        closed_comment: this.state.comment,
        items: items,
        types: this.state.types,
        quantities: quantities
      }),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:  function(response){
        var user = _this.state.selectedUser
        _this.setState(_this.getInitialState(), _this.componentWillMount);
        _this.setState({
          showErrorMessage: false,
          errorMessage: "",
          showCreatedSuccess: true,
          createdMessage: "Successfully disbursed to " + user + "."
        })
      },
      complete: function(){},
      error:    function (xhr, textStatus, thrownError){
        var response = xhr.responseJSON
        _this.setState({
          showErrorMessage: true,
          errorMessage: response.error,
          showCreatedSuccess: false,
          createdMessage: ""
        })
      }
    });
  },

  isValidAddition() {
    return ((this.state.selectedItem.length <= 0) || (Number(this.state.quantity) <= 0))
  },

  isValidDisbursement() {
    return (
      (this.state.selectedItems.length <= 0) ||
      (this.state.selectedUser == "")
    )
  },

  getSuccessMessage() {
    var ret = this.state.showCreatedSuccess ? (
      <Row>
        <Col sm={12}>
          <Alert bsStyle="success" bsSize="small">{this.state.createdMessage}</Alert>
        </Col>
      </Row>) : (null)
    return ret
  },

  getErrorMessage() {
    return this.state.showErrorMessage ? (
      <Row>
        <Col sm={12}>
          <Alert bsStyle="danger" bsSize="small">{this.state.errorMessage}</Alert>
        </Col>
      </Row>
    ) : null
  },

  getDisbursementCreationForm() {
    return (
      <Row>
        <Col xs={12}>
          <h5>Add items to loan</h5>
          <hr />
        </Col>
      </Row>

      <Row>
        <Col xs={6}>
          <Form horizontal>

            <FormGroup bsSize="small" controlId="itemSelect">
              <Col sm={2} componentClass={ControlLabel}>
                Item:
              </Col>
              <Col sm={10}>
                <Select style={{fontSize: '12px', maxHeight: '10px'}}
                        options={this.state.items}
                        placeholder="Select Item"
                        name="selectedItem"
                        value={this.state.selectedItem}
                        onChange={this.handleItemSelection}
                        searchable={true}
                        clearable />
              </Col>
            </FormGroup>

            <FormGroup bsSize="small">
              <Col sm={2} componentClass={ControlLabel}>
                Type:
              </Col>
              <Col sm={5}>
                <FormControl className="text-center"
                             style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                             componentClass="select"
                             name="type"
                             value={this.state.type}
                             onChange={this.handleChange}>
                  <option value="disbursement">Disbursement</option>
                  <option value="loan">Loan</option>
                </FormControl>
              </Col>
              <Col sm={2} componentClass={ControlLabel}>
                Quantity:
              </Col>
              <Col sm={3}>
                <FormControl type="number" className="text-center" name="quantity" value={this.state.quantity} onChange={this.handleChange}/>
              </Col>
            </FormGroup>
            <FormGroup bsSize="small">
              <Col sm={4} smOffset={2} style={{fontSize:"12px"}}>
                <Button  bsSize="small" bsStyle="info" style={{fontSize:"12px"}} disabled={this.isValidAddition()} onClick={this.addItemToDisbursement}>Add Item</Button>
              </Col>
            </FormGroup>

          </Form>
        </Col>

        <Col xs={6}>
          { this.getSelectedItemList() }
        </Col>
      </Row>

      <hr />

      <Form horizontal>

        <FormGroup bsSize="small" controlId="userItemSelect">
          <Col sm={1} componentClass={ControlLabel}>
            User
          </Col>
          <Col sm={3}>
            <Select style={{fontSize: '12px'}}
                    options={this.state.users}
                    placeholder="Select User"
                    name="selectedUser"
                    value={this.state.selectedUser}
                    onChange={this.handleUserSelection}
                    searchable={true}
                    clearable />
          </Col>
        </FormGroup>

        <FormGroup bsSize="small" controlId="commentForm">
          <Col componentClass={ControlLabel} sm={1}>
            Comment
          </Col>
          <Col sm={9}>
            <FormControl type="text" style={{resize: "vertical", height:"100px"}} componentClass={"textarea"} value={this.state.comment} name="comment" onChange={this.handleChange} />
          </Col>
        </FormGroup>


        <FormGroup>
          <Col sm={2} smOffset={1}>
            <Button bsStyle="info" bsSize="small" disabled={this.isValidDisbursement()} onClick={this.disburse}>Disburse</Button>
          </Col>
        </FormGroup>

      </Form>
    )
  }

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col sm={12}>
            <h3>Direct Disbursement</h3>
            <hr />
            <p>
              Use this form to disburse items directly to users without waiting for them to initiate a request.
            </p>
            <p>
              A request will be automatically generated, logged, and approved for disbursement on behalf of the specified user.
            </p>
            <br />
          </Col>
        </Row>

        { this.getSuccessMessage() }
        { this.getErrorMessage() }

        <Row>
          <Col sm={12}>
            <Panel>

              { this.getDisbursementCreationForm() }

            </Panel>
            <br />
          </Col>
        </Row>

      </Grid>

    )
  }
});

export default DisbursementContainer
