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

      selectedItem: "",
      selectedUser: "",

      selectedItems: [],
      quantities: [],

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
    selectedItems.push(this.state.selectedItem)
    quantities.push(this.state.quantity)
    this.setState({
      selectedItem: "",
      quantity: 0,
      items: items,
      selectedItems: selectedItems,
      quantities: quantities
    })
  },

  getSelectedItemList() {
    return (
     this.state.selectedItems.map( (item, i) => {
        var start_label = (i == 0) ? "Selected" : null
        var start_break = (i == 0) ? <br /> : null
        return (
          <FormGroup bsSize="small" key={item + i}>
            {start_break}
            <Col sm={2} componentClass={ControlLabel}>
              {start_label}
            </Col>
            <Col sm={4}>
              <FormControl type="text" className="text-left" value={item} disabled />
            </Col>
            <Col sm={2} smOffset={1}>
              <FormControl type="number" className="text-center" value={this.state.quantities[i]} disabled />
            </Col>
            <Col sm={2}>
              <Button block bsStyle="danger" bsSize="small" onClick={() => this.removeItemFromDisbursement(i)}>Remove</Button>
            </Col>
          </FormGroup>
        )
      })
    );
  },

  disburse() {
    var items = this.state.selectedItems;
    var quantities = this.state.quantities;
    var _this = this;
    ajax({
      url:"/api/disburse/",
      type: "POST",
      traditional: true,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      data: {
        requester: this.state.selectedUser,
        closed_comment: this.state.comment,
        items: items,
        quantities: quantities
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

  render() {
    return (
      <Grid fluid>
        <Row>
          <Col sm={12}>
            <h3>Disbursement</h3>
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
              <div>
                <h4>Select a user</h4>
                <hr />
              </div>

              <Form horizontal>

                <FormGroup bsSize="small" controlId="userItemSelect">
                  <Col sm={2} componentClass={ControlLabel}>
                    User
                  </Col>
                  <Col sm={9}>
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

                <div>
                  <br />
                  <h4>Choose items</h4>
                  <hr />
                </div>

                <FormGroup bsSize="small" controlId="itemSelect">
                  <Col sm={2} componentClass={ControlLabel}>
                    Items
                  </Col>
                  <Col sm={4}>
                    <Select style={{fontSize: '12px', maxHeight: '10px'}}
                            options={this.state.items}
                            placeholder="Select Item"
                            name="selectedItem"
                            value={this.state.selectedItem}
                            onChange={this.handleItemSelection}
                            searchable={true}
                            clearable />
                  </Col>
                  <Col sm={1} componentClass={ControlLabel}>
                    Quantity
                  </Col>
                  <Col sm={2}>
                    <FormControl type="number" className="text-center" name="quantity" value={this.state.quantity} onChange={this.handleChange}/>
                  </Col>
                  <Col sm={2}>
                    <Button block bsSize="small" bsStyle="info" disabled={this.isValidAddition()} onClick={this.addItemToDisbursement}>Add Item</Button>
                  </Col>
                </FormGroup>

                { this.getSelectedItemList() }

                <hr />

                <FormGroup bsSize="small" controlId="commentForm">
                  <Col componentClass={ControlLabel} sm={2}>
                    Comment
                  </Col>
                  <Col sm={9}>
                    <FormControl type="text" style={{resize: "vertical", height:"100px"}} componentClass={"textarea"} value={this.state.comment} name="comment" onChange={this.handleChange} />
                  </Col>
                </FormGroup>


                <FormGroup>
                  <Col sm={2} smOffset={2}>
                    <Button bsStyle="info" bsSize="small" disabled={this.isValidDisbursement()} onClick={this.disburse}>Disburse</Button>
                  </Col>
                </FormGroup>

              </Form>

            </Panel>
            <br />
          </Col>
        </Row>

      </Grid>

    )
  }
});

export default DisbursementContainer
