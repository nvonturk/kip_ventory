import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, FormGroup, FormControl, ControlLabel, Glyphicon, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import CreateTransactionsContainer from '../CreateTransactionsContainer'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../TagMultiSelect'


const ManagerDetail = React.createClass({
  getInitialState() {
    return {
      requests: [],
      transactions: [],
      loans: [],
      disbursements: [],
      addToCartQuantity: 1,
      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },
      stacks: {},
      modifyItem: false,
      deleteItem: false
    }
  },

  componentWillMount() {
    var user = this.props.route.user
    this.getItem();
    this.getOutstandingRequests();
    if (user.is_staff || user.is_superuser) {
      this.getTransactions();
    }
    this.getStacks();
    this.getLoans();
    this.getDisbursements();
  },

  getStacks() {
    var url = "/api/items/" + this.props.params.item_name + "/stacks/"
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        stacks: data
      })
    })
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
    var params = {status: "O", all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        requests: data.results
      })
    })
  },

  getTransactions() {
    var url = "/api/transactions/"
    var params = {all: true}
    var _this = this;
    getJSON(url, params, function(data) {
      _this.setState({
        transactions: data.results
      })
    })
  },

  getLoans() {
    var url = "/api/items/" + this.props.params.item_name + "/loans/"
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        loans: data.results
      })
    })
  },

  getDisbursements() {
    var url = "/api/items/" + this.props.params.item_name + "/disbursements/"
    var _this = this;
    getJSON(url, function(data) {
      _this.setState({
        disbursements: data.results
      })
    })
  },

  handleItemFormChange(e) {
    e.preventDefault()
    var item = this.state.item
    item[e.target.name] = e.target.value
    this.setState({
      item: item
    })
  },

  handleSubmit(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/items/" + this.props.params.item_name + "/"
    var data = this.state.item
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "PUT",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success: function(response) {
        for (var i=0; i<_this.state.item.custom_fields.length; i++) {
          var cf = _this.state.item.custom_fields[i]
          var url = "/api/items/" + _this.state.item.name + "/fields/" + cf.name + "/"
          ajax({
            url: url,
            contentType: "application/json",
            type: "PUT",
            data: JSON.stringify({
              value: cf.value
            }),
            beforeSend: function(request) {
              request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            },
            success:function(response){},
            complete:function(){},
            error:function (xhr, textStatus, thrownError){
              console.log(xhr);
              console.log(textStatus);
              console.log(thrownError);
            }
          });
        }
        var new_url = "/app/inventory/" + response.name + "/"
        window.location.assign(new_url)
      }
    })
  },

  handleTagSelection(tagsSelected) {
    var item = this.state.item
    var tags = tagsSelected.split(",")
    if (tags.length == 1) {
      if (tags[0] == "") {
        tags = []
      }
    }
    item.tags = tags
    this.setState({item: item});
  },

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="text"
                     value={this.state.item.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
          <ControlLabel>{presentation_name}</ControlLabel>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name}</ControlLabel>
        <FormControl type="number"
                     min={min}
                     step={step}
                     value={this.state.item.custom_fields[i].value}
                     name={field_name}
                     onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small">
        <ControlLabel>{presentation_name} </ControlLabel>
        <FormControl type="number"
                   value={this.state.item.custom_fields[i].value}
                   name={field_name}
                   onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
      </FormGroup>
    )
  },

  handleCustomFieldChange(i, name, e) {
    var item = this.state.item
    item.custom_fields[i].value = e.target.value
    this.setState({
      item: item
    }, () => {console.log(item)})
  },

  getQuantityAndModelNoForm() {
    return (
      <Row>
        <Col sm={8} xs={12}>
          <FormGroup bsSize="small" controlId="model_no">
            <ControlLabel>Model No.</ControlLabel>
            <FormControl disabled={!this.props.route.user.is_superuser && !this.props.route.user.is_staff}
                         type="text"
                         name="model_no"
                         value={this.state.item.model_no}
                         onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
        <Col sm={4} xs={12}>
          <FormGroup bsSize="small" controlId="quantity" >
            <ControlLabel>Quantity<span style={{color:"red"}}>*</span></ControlLabel>
            <FormControl disabled={!this.props.route.user.is_superuser}
                         type="number"
                         name="quantity"
                         value={this.state.item.quantity}
                         onChange={this.handleItemFormChange}/>
          </FormGroup>
        </Col>
      </Row>
    )
  },

  getCustomFieldForms() {
    return this.state.item.custom_fields.map( (field, i) => {

      var field_name = field.name
      var is_private = field.private
      var field_type = field.field_type

      switch(field_type) {
        case "Single":
          return this.getShortTextField(field_name, field_name, i)
          break;
        case "Multi":
          return this.getLongTextField(field_name, field_name, i)
          break;
        case "Int":
          return this.getIntegerField(field_name, field_name, 0, 1, i)
          break;
        case "Float":
          return this.getFloatField(field_name, field_name, i)
          break
        default:
          return null
      }
    })
  },

  handleCartQuantityChange(e) {
    var q = Number(e.target.value)
    if (q > this.state.item.quantity) {
      event.stopPropagation()
    } else {
      this.setState({
        addToCartQuantity: q
      })
    }
  },

  addToCart(e) {
    e.stopPropagation()
    e.preventDefault()
    var url = "/api/items/" + this.state.item.name + "/addtocart/"
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify({
        quantity: _this.state.addToCartQuantity
      }),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var new_url = "/app/inventory/" + _this.state.item.name + "/"
        window.location.assign(new_url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  toggleEdit(e) {
    e.preventDefault()
    var cur = this.state.modifyItem
    this.setState({
      modifyItem: !cur
    })
  },

  toggleDeleteConfirmation(e) {
    e.preventDefault()
    var cur = this.state.deleteItem
    this.setState({
      deleteItem: !cur
    })
  },

  deleteItem(e) {
    e.preventDefault()
    var url = "/api/items/" + this.state.item.name + "/"
    ajax({
      url: url,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        var new_url = "/app/inventory/"
        browserHistory.push(new_url)
      },
      complete:function(){},
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    });
  },

  getItemModificationForm() {
    var deleteIcon = null
    if (this.props.route.user.is_superuser) {
      deleteIcon = <Glyphicon glyph="trash" style={{paddingLeft: "20px"}} onClick={this.toggleDeleteConfirmation}/>
    }
    return (
      <Panel header={
        <div>
          <span>Product Information</span>
          <span className="clickable" style={{float: "right"}}>
            <Glyphicon glyph="remove" onClick={this.toggleEdit}/>
            { deleteIcon }
          </span>
        </div>} >
        <Form onSubmit={this.handleSubmit}>
          <Row>
            <Col sm={12} xs={12}>
              <FormGroup bsSize="small" controlId="name">
                <ControlLabel>Name<span style={{color:"red"}}>*</span></ControlLabel>
                <FormControl type="text" name="name" value={this.state.item.name} onChange={this.handleItemFormChange}/>
              </FormGroup>
            </Col>
          </Row>

          {this.getQuantityAndModelNoForm()}

          <Row>
            <Col sm={12} xs={12}>
              <FormGroup bsSize="small" controlId="description">
                <ControlLabel>Description</ControlLabel>
                <FormControl type="text"
                             style={{resize: "vertical", height:"100px"}}
                             componentClass={"textarea"}
                             name="description"
                             value={this.state.item.description}
                             onChange={this.handleItemFormChange}/>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col sm={12} xs={12}>
              <FormGroup bsSize="small" controlId="tags">
                <ControlLabel>Tags</ControlLabel>
                <TagMultiSelect tagsSelected={this.state.item.tags} tagHandler={this.handleTagSelection}/>
              </FormGroup>
            </Col>
          </Row>

          {this.getCustomFieldForms()}

          <Row>
            <Col sm={6} smOffset={0} xs={4} xsOffset={4}>
              <Button bsSize="small" bsStyle="info" type="submit">Save</Button>
            </Col>
          </Row>

        </Form>
      </Panel>
    )
  },

  getReadOnlyItemInfo() {
    var deleteIcon = null
    if (this.props.route.user.is_superuser) {
      deleteIcon = <Glyphicon glyph="trash" style={{paddingLeft: "20px"}} onClick={this.toggleDeleteConfirmation}/>
    }
    return (
      <Panel header={
        <div>
          <span>Product Information</span>
          <span className="clickable" style={{float: "right"}}>
            <Glyphicon glyph="pencil" onClick={this.toggleEdit}/>
            { deleteIcon }
          </span>
        </div>} >
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Name</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.name}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Model No.</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.model_no}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Quantity</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.quantity}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Description</th>
              <td style={{border: "1px solid #596a7b"}}>
                <pre style={{fontFamily: '"Lato","Helvetica Neue",Helvetica,Arial,sans-serif',
                             color:"white",
                             fontSize:"12px",
                             border: "0px",
                             backgroundColor:"inherit",
                             margin: "auto", padding: "0px"}}>
                  {this.state.item.description}
                </pre>
              </td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Tags</th>
              <td style={{border: "1px solid #596a7b"}}>{this.state.item.tags.join(", ")}</td>
            </tr>

            {this.state.item.custom_fields.map( (cf, i) => {
              return (
                <tr key={i}>
                  <th style={{paddingRight:"10px", border: "1px solid #596a7b"}}>{cf.name}</th>
                  <td style={{border: "1px solid #596a7b"}}>{cf.value}</td>
                </tr>
              )
            })}

          </tbody>
        </Table>
      </Panel>
    )
  },

  getItemInfoPanel() {
    if (this.state.modifyItem) {
      return this.getItemModificationForm()
    } else {
      return this.getReadOnlyItemInfo()
    }
  },

  getRequestsPanel() {
    var requestsTable = null
    if (this.state.requests.length == 0) {
      requestsTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}}>
          You have no outstanding requests for this item.
        </Well>
      )
    } else {
      requestsTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Opened</th>
              <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity</th>
              <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Type</th>
            </tr>
          </thead>
          <tbody>

            { this.state.requests.map( (request, i) => {
              var request_item = request.requested_items.filter( (ri) => {return (ri.item == this.state.item.name)})[0]
              return (
                <tr key={request.request_id}>
                  <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {request.request_id}
                  </td>
                  <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <a style={{color: "#5bc0de"}} href={"/app/requests/" + request.request_id + "/"}>Click to view</a>
                  </td>
                  <td data-th="Date Opened" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(request.date_open).toLocaleDateString()}
                  </td>
                  <td data-th="Quantity" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {request_item.quantity}
                  </td>
                  <td data-th="Type" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <Label bsSize="small" bsStyle={(request_item.request_type == "loan") ? ("info") : ("warning")}>
                      {request_item.request_type}
                    </Label>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <Panel style={{marginBottom:"0px"}} header={"Outstanding Requests"}>
        { requestsTable }
      </Panel>
    )
  },

  getLoanPanel() {
    var loanTable = null;
    if (this.state.loans.length == 0) {
      loanTable = (
        <Well bsSize="small" style={{marginBottom:"0px", fontSize: "12px"}}>
          This item has not been loaned to you.
        </Well>
      )
    } else {
      loanTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
            <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Approved</th>
            <th style={{width: "15%", borderBottom: "1px solid #596a7b"}} className="text-center">Loaned</th>
            <th style={{width: "25%", borderBottom: "1px solid #596a7b"}} className="text-center">Returned</th>
            </tr>
          </thead>
          <tbody>
            { this.state.loans.map( (loan, i) => {
              return (
                <tr key={loan.id}>
                  <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.id}
                  </td>
                  <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <a style={{color: "#5bc0de"}} href={"/app/loans/" + loan.id + "/"}>Click to view</a>
                  </td>
                  <td data-th="Date Approved" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(loan.request.date_closed).toLocaleDateString()}
                  </td>
                  <td data-th="Loaned" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.quantity_loaned}
                  </td>
                  <td data-th="Returned" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {loan.quantity_returned}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <Panel header={"Approved Loans"}>
        { loanTable }
      </Panel>
    )
  },

  getDisbursementPanel() {
    var disbursementTable = null
    if (this.state.disbursements.length == 0) {
      disbursementTable = (
        <Well bsSize="small" style={{marginBottom: "0px", fontSize: "12px"}}>
          This item has not been disbursed to you.
        </Well>
      )
    } else {
      disbursementTable = (
        <Table style={{marginBottom:"0px"}}>
          <thead>
            <tr>
            <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">#</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Link</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Date Approved</th>
            <th style={{width: "30%", borderBottom: "1px solid #596a7b"}} className="text-center">Quantity Disbursed</th>
            </tr>
          </thead>
          <tbody>
            { this.state.disbursements.map( (disbursement, i) => {
              return (
                <tr key={disbursement.id}>
                  <td data-th="#" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {disbursement.id}
                  </td>
                  <td data-th="Link" className="text-center" style={{border: "1px solid #596a7b"}}>
                    <a style={{color: "#5bc0de"}} href={"/app/disbursements/" + disbursement.id + "/"}>Click to view</a>
                  </td>
                  <td data-th="Date Approved" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {new Date(disbursement.request.date_closed).toLocaleDateString()}
                  </td>
                  <td data-th="Quantity Disbursed" className="text-center" style={{border: "1px solid #596a7b"}}>
                    {disbursement.quantity}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )
    }
    return (
      <Panel header={"Approved Disbursements"}>
        {disbursementTable}
      </Panel>
    )
  },

  getAddToCartForm() {
    return (
        <Grid fluid>
          <Row>
            <Col xs={12}>
              <h4><a href={"/app/inventory/" + this.state.item.name + "/"}>{this.props.params.item_name}</a></h4>
              <hr />
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              <Form horizontal onSubmit={this.addToCart}>
                <FormGroup bsSize="small">
                  <Col sm={3} componentClass={ControlLabel}>
                    Quantity:
                  </Col>
                  <Col sm={4}>
                    <FormControl type="number"
                                 min={1} max={this.state.item.quantity} step={1}
                                 name="addToCartQuantity"
                                 value={this.state.addToCartQuantity}
                                 onChange={this.handleCartQuantityChange} />
                  </Col>
                  <Col sm={4}>
                    <Button bsStyle="info" bsSize="small" type="submit">Add to cart</Button>
                  </Col>
                </FormGroup>
              </Form>
            </Col>
          </Row>
        </Grid>
    )
  },

  getItemStacksPanel() {
    return (
      <Panel header={"Item Tracking"}>
        <Table style={{marginBottom: "0px", borderCollapse: "collapse"}}>
          <tbody>
            <tr>
              <th className="text-center" style={{paddingRight:"15px", verticalAlign: "middle"}}>Status</th>
              <th className="text-center">Quantity</th>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Requested</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.requested}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Loaned</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.loaned}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>Disbursed</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.disbursed}</td>
            </tr>

            <tr>
              <th style={{paddingRight:"15px", verticalAlign: "middle", border: "1px solid #596a7b"}}>In Cart</th>
              <td style={{border: "1px solid #596a7b"}} className="text-center">{this.state.stacks.in_cart}</td>
            </tr>
          </tbody>
        </Table>
      </Panel>
    )
  },

  render() {
    return (
      <Grid>
        <Row>
          <Col sm={12}>
            <Row>
              <Col sm={12}>
                <h3>{this.props.params.item_name}</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col sm={5}>
                { this.getItemInfoPanel() }
              </Col>
              <Col sm={4}>
                { this.getAddToCartForm() }
              </Col>
              <Col sm={3}>
                { this.getItemStacksPanel() }
              </Col>
            </Row>

            <hr />
            <br />

            <Row>
              <Col sm={6}>
                { this.getRequestsPanel() }
              </Col>
              <Col sm={6}>
                <Row>
                  <Col sm={12}>
                    { this.getLoanPanel() }
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    { this.getDisbursementPanel() }
                  </Col>
                </Row>
              </Col>
            </Row>

          </Col>
        </Row>

        <Modal show={this.state.deleteItem} onHide={this.toggleDeleteConfirmation}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Item</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p style={{fontSize: "14px"}}>Are you sure you want to delete this item?</p>
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={this.toggleDeleteConfirmation}>Cancel</Button>
            <Button bsStyle="danger" bsSize="small" onClick={this.deleteItem}>Delete</Button>
          </Modal.Footer>
        </Modal>

      </Grid>
    )
  }

})

export default ManagerDetail
