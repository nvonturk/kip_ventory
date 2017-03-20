import React, { Component } from 'react'
import { Grid, Row, Col, Table, Image, Button, Panel, Label, Modal, Glyphicon, Form, Pagination, FormGroup, FieldGroup, FormControl, ControlLabel, InputGroup } from 'react-bootstrap'
import InventoryItem from './InventoryItem'
import InventoryGridHeader from './InventoryGridHeader'
import Paginator from '../Paginator'
import { ajax, getJSON } from 'jquery'
import { browserHistory } from 'react-router';
import TagMultiSelect from '../TagMultiSelect'
import { getCookie } from '../../csrf/DjangoCSRFToken'

import Select from 'react-select';
import 'react-select/dist/react-select.css';


const ITEMS_PER_PAGE = 10;

const InventoryContainer = React.createClass({
  getInitialState() {
    return {
      items:[],
      tagsSelected: [],
      excludeTagsSelected: [],
      searchText: "",
      page: 1,
      pageCount: 0,
      tags: [],
      showItemCreationModal: false,
      custom_fields: [],
      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      }
    }
  },

  componentWillMount() {
    this.getAllItems(); //maybe move to componentDidMount()
    this.getAllTags();
  },

  getItems(params) {
    var url = "/api/items/";
    var thisobj = this;
    getJSON(url, params, function(data) {
      var cf = data.results[0].custom_fields
      var item = thisobj.state.item
      item.custom_fields = cf.map((c, i) => {
        c.value = ""
        return c
      })
      thisobj.setState({
        item: item,
        items: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
  },

  getAllItems() {
    var params = {
      page: 1,
      itemsPerPage: ITEMS_PER_PAGE
    }
    this.getItems(params);
  },

  filterItems() {
    var params = {
      search: this.state.searchText,
      tags: this.state.tagsSelected,
      excludeTags: this.state.excludeTagsSelected,
      page: this.state.page,
      itemsPerPage: ITEMS_PER_PAGE
    }
    this.getItems(params);
  },

  getAllTags() {
    var url = "/api/tags/"
    var params = {"all": true}
    var _this = this;
    getJSON(url, params, function(data) {
      data = data.map( (tag, i) => {return {value: tag.name, label: tag.name}})
      _this.setState({tags: data})
    })
  },

  handleSearch(e) {
    e.preventDefault()
    this.setState({page: 1}, () => {
      this.filterItems();
    });
  },

  createItem(e) {
    e.preventDefault()
    e.stopPropagation()
    var url = "/api/items/"
    var data = this.state.item
    var _this = this
    ajax({
      url: url,
      contentType: "application/json",
      type: "POST",
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
            error:function (xhr, textStatus, thrownError){
              console.log(xhr);
              console.log(textStatus);
              console.log(thrownError);
            }
          });
        }
        _this.setState({
          showItemCreationModal: false
        })
      },
      // TODO : BETTER ERROR HANDLING. PARSE THE RESULT, AND ASSOCIATE WITH THE CORRECT FORM FIELD
      // USE THE <HelpBlock /> component to add subtext to the forms that failed the test.
      error:function (xhr, textStatus, thrownError){
        console.log(xhr);
        console.log(textStatus);
        console.log(thrownError);
      }
    })
  },

  handleIncludeTagSelection(tagsSelected) {
    tagsSelected = tagsSelected.map((tag, i) => {return tag.value}).join(",")
    this.setState({tagsSelected: tagsSelected, page: 1}, this.filterItems);
  },

  handleExcludeTagSelection(excludeTagsSelected) {
    excludeTagsSelected = excludeTagsSelected.map((tag, i) => {return tag.value}).join(",")
    this.setState({excludeTagsSelected: excludeTagsSelected, page: 1}, this.filterItems);
  },

  handlePageSelect(activeKey) {
    this.setState({page: activeKey}, () => {
      this.filterItems();
    })
  },

  handleChangeQuantity(index, quantity) {
    this.setState(function(prevState, props) {
      prevState.items[index].quantity = parseInt(prevState.items[index].quantity) + parseInt(quantity);
      return {
        items: prevState.items
      };
    });
  },

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
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

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
        </Col>
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
        </Col>
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small">
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       min={min}
                       step={step}
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
        </Col>
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small">
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
        </Col>
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
        <Col xs={12}>
          <FormGroup bsSize="small" controlId="model_no">
            <Col xs={2} componentClass={ControlLabel}>
              Model No.
            </Col>
            <Col xs={8}>
              <FormControl type="text"
                           name="model_no"
                           value={this.state.item.model_no}
                           onChange={this.handleItemFormChange}/>
            </Col>
          </FormGroup>
        </Col>
        <Col xs={4} xs={12}>
          <FormGroup bsSize="small" controlId="quantity" >
            <Col xs={2} componentClass={ControlLabel}>
              Quantity <span style={{color: "red"}}>*</span>
            </Col>
            <Col xs={8}>
              <FormControl type="number"
                           name="quantity"
                           value={this.state.item.quantity}
                           onChange={this.handleItemFormChange}/>
            </Col>
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

  getItemModificationForm() {
    return (
      <Form horizontal onSubmit={e => {e.preventDefault(); e.stopPropagation()}}>

        <FormGroup bsSize="small" controlId="name">
          <Col xs={2} componentClass={ControlLabel}>
            Name <span style={{color:"red"}}>*</span>
          </Col>
          <Col xs={8}>
            <FormControl type="text"
                         name="name"
                         value={this.state.item.name}
                         onChange={this.handleItemFormChange}/>
          </Col>
        </FormGroup>

        {this.getQuantityAndModelNoForm()}

        <FormGroup bsSize="small" controlId="description">
          <Col xs={2} componentClass={ControlLabel}>
            Description
          </Col>
          <Col xs={8}>
            <FormControl type="text"
                         style={{resize: "vertical", height:"100px"}}
                         componentClass={"textarea"}
                         name="description"
                         value={this.state.item.description}
                         onChange={this.handleItemFormChange}/>
          </Col>
        </FormGroup>

        <FormGroup bsSize="small" controlId="tags">
          <Col xs={2} componentClass={ControlLabel}>
            Tags
          </Col>
          <Col xs={8}>
            <TagMultiSelect tagsSelected={this.state.item.tags} tagHandler={this.handleTagSelection}/>
          </Col>
        </FormGroup>

        {this.getCustomFieldForms()}

      </Form>
    )
  },

  showCreateItemForm(e) {
    this.setState({
      showItemCreationModal: true
    })
  },

  render() {
    var bulkImportPanel = (this.props.route.user.is_staff || this.props.route.user.is_superuser) ? (
      <Panel header={<span>Import Items</span>}>
        <Row>
          <Col md={12}>
            <p style={{fontSize:"12px"}}>
              Choose a .csv file from which to import items.
            </p>
            <p style={{fontSize:"12px"}}>
              Click <a href="/api/import/template/">here</a> to download a .csv file template.
            </p>
          </Col>
          <Col md={12}>
            <Form >
              <FormGroup bsSize="small">
              <Col md={12} sm={6} xs={6}>
                <FormControl bsSize="small" style={{fontSize:"12px", color:"white"}} type="file" accept="csv"/>
              </Col>
              </FormGroup>

              <Col md={12} smHidden xsHidden>
                <br />
              </Col>
              <Col md={4} sm={6} xs={6}>
                <Button type="submit" bsSize="small" bsStyle="info">Import</Button>
              </Col>
            </Form>
          </Col>
        </Row>
      </Panel>
    ) : null
    var inventoryPanelHeader = (this.props.route.user.is_staff || this.props.route.user.is_superuser) ? (
      <Row>
        <Col md={12}>
          <span className="panel-title">Current Inventory</span>
          <Button bsSize="small" bsStyle="default" style={{border: "1px solid rgb(223, 105, 26)", padding:"7px", fontSize:"12px", float: "right", marginRight:"10px", verticalAlign:"middle"}} onClick={this.showCreateItemForm}>
            Add Item &nbsp; <Glyphicon glyph="plus" />
          </Button>
        </Col>
      </Row>
    ) : "Current Inventory"
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <Row >
              <Col md={12}>
                <h3>ECE Department Inventory</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col md={3} sm={12}>
                <Row>
                  <Col md={12} sm={6}>
                    <Panel header={<span>Refine Results</span>}>
                      <Row>
                        <Col md={12}>
                          <FormGroup>
                            <ControlLabel>Search</ControlLabel>
                            <InputGroup bsSize="small">
                              <FormControl placeholder="Search"
                                           style={{fontSize:"12px"}}
                                           type="text" name="searchText"
                                           value={this.state.searchText}
                                           onChange={e => {this.handleChange(e); this.handleSearch(e);}}/>
                              <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.handleSearch}>
                                <Glyphicon glyph="search"/>
                              </InputGroup.Addon>
                            </InputGroup>
                          </FormGroup>

                          <FormGroup bsSize="small">
                            <ControlLabel>Tags to include</ControlLabel>
                            <Select style={{fontSize:"12px"}} name="include-tags"
                                    multi={true}
                                    placeholder="Tags to include"
                                    value={this.state.tagsSelected}
                                    options={this.state.tags}
                                    onChange={this.handleInputTagSelection}
                            />
                          </FormGroup>

                          <FormGroup bsSize="small">
                            <ControlLabel>Tags to exclude</ControlLabel>
                            <Select style={{fontSize:"12px"}} name="exclude-tags"
                                    multi={true}
                                    placeholder="Tags to exclude"
                                    value={this.state.excludeTagsSelected}
                                    options={this.state.tags}
                                    onChange={this.handleExcludeTagSelection}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </Panel>
                  </Col>
                  <Col md={12} sm={6}>
                    { bulkImportPanel }
                  </Col>
                </Row>
              </Col>
              <Col md={9} sm={12}>
                <div className="panel panel-default">

                  <div className="panel-heading">
                    { inventoryPanelHeader }
                  </div>

                  <div className="panel-body" style={{minHeight: "480px", maxHeight: "500px"}}>
                    <Table condensed hover style={{marginBottom: "0px"}}>
                      <thead>
                        <tr>
                          <th style={{width:"25%"}} className="text-left">Item</th>
                          <th style={{width:"10%"}} className="text-center">Model No.</th>
                          <th style={{width:"10%"}} className="text-center">In Stock</th>
                          <th style={{width:"10%"}} className="text-center">Tags</th>
                          <th style={{width:"10%"}} className="spacer" />
                          <th style={{width:"10%"}} className="text-center">Status</th>
                          <th style={{width:"8%" }} className="text-center">Quantity</th>
                          <th style={{width:"5%"}} className="spacer" />
                          <th style={{width:"12%"}} className="text-center"></th>
                        </tr>
                        <tr>
                          <th colSpan={9}>
                            <hr style={{margin: "auto"}} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.items.map( (item, i) => {
                          return (<InventoryItem key={item.name} item={item} />)
                        })}
                      </tbody>
                    </Table>
                  </div>

                  <div className="panel-footer">
                    <Row>
                      <Col md={12}>
                        <Pagination next prev maxButtons={10} boundaryLinks ellipsis style={{float:"right", margin: "0px"}} bsSize="small" items={this.state.pageCount} activePage={this.state.page} onSelect={this.handlePageSelect} />
                      </Col>
                    </Row>
                  </div>

                </div>
              </Col>
            </Row>
          </Col>
        </Row>

        <Modal show={this.state.showItemCreationModal} onHide={e => {this.setState({showItemCreationModal: false})}}>
          <Modal.Header closeButton>
            <Modal.Title>Add Item to Inventory</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            { this.getItemModificationForm() }
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={e => {this.setState({showItemCreationModal: false})}}>Cancel</Button>
            <Button bsStyle="info" bsSize="small" onClick={this.createItem}>Create</Button>
          </Modal.Footer>
        </Modal>

      </Grid>
    )
  }
});

export default InventoryContainer
