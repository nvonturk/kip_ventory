import React, { Component } from 'react'
import { Grid, Row, Col, Table, Image, Button, Panel, Label, Modal, HelpBlock,
         Glyphicon, Form, Pagination, FormGroup, FieldGroup, FormControl, Well,
        ControlLabel, InputGroup } from 'react-bootstrap'
import InventoryItem from './InventoryItem'
import InventoryGridHeader from './InventoryGridHeader'
import Paginator from '../Paginator'
import { ajax, getJSON } from 'jquery'
import { browserHistory } from 'react-router';
import TagMultiSelect from '../TagMultiSelect'
import { getCookie, CSRFToken } from '../../csrf/DjangoCSRFToken'

import FileInput from 'react-file-input'
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
      pageCount: 1,
      tags: [],
      showItemCreationModal: false,
      showBulkImportModal: false,
      custom_fields: [],
      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },

      errorNodes: {},
      bulkImportErrorNodes: {},
      importSuccess: null,

      importFile: null,
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
      var item = thisobj.state.item
      if (data.results.length > 0) {
        var cf = data.results[0].custom_fields
        item.custom_fields = cf.map((c, i) => {
          c.value = ""
          return c
        })
      }
      thisobj.setState({
        item: item,
        items: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
  },

  getAllItems() {
    var params = {
      page: this.state.page,
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
        // Show success message
        var itemURL = "/app/inventory/" + response.name + "/"
        _this.setState({
          item: {
            name: "",
            model_no: "",
            quantity: 0,
            tags: [],
            description: "",
            custom_fields: []
          },
          showItemCreationModal: false,
          nameErrorNode: null,
          quantityErrorNode: null,
        }, () => {browserHistory.push(itemURL)})
      },
      // TODO : BETTER ERROR HANDLING. PARSE THE RESULT, AND ASSOCIATE WITH THE CORRECT FORM FIELD
      // USE THE <HelpBlock /> component to add subtext to the forms that failed the test.
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 400) {
          var response = xhr.responseJSON
          var errNodes = JSON.parse(JSON.stringify(_this.state.errorNodes))
          for (var key in response) {
            if (response.hasOwnProperty(key)) {
              var node = <span key={key} className="help-block">{response[key][0]}</span>
              errNodes[key] = node
            }
          }
          _this.setState({
            errorNodes: errNodes
          })
        }
      }
    })
  },

  handleIncludeTagSelection(tagsSelected) {
    tagsSelected = tagsSelected.map((tag, i) => {return tag.value}).join(",")
    console.log(tagsSelected)
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
    var errNodes = this.state.errorNodes
    errNodes[e.target.name] = null
    item[e.target.name] = e.target.value
    this.setState({
      item: item,
      errorNodes: errNodes
    })
  },

  getShortTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getFormValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getFormValidationState(field_name)}>
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
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getFormValidationState(field_name)}>
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
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getFormValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       value={this.state.item.custom_fields[i].value}
                       name={field_name}
                       onChange={this.handleCustomFieldChange.bind(this, i, field_name)} />
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  handleCustomFieldChange(i, name, e) {
    var item = this.state.item
    item.custom_fields[i].value = e.target.value
    var errNodes = this.state.errorNodes
    errNodes[name] = null
    this.setState({
      item: item,
      errorNodes: errNodes
    })
  },

  getFormValidationState(field_name) {
    return (this.state.errorNodes[field_name] == null) ? null : "error"
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
              { this.state.errorNodes["model_no"] }
            </Col>
          </FormGroup>
        </Col>
        <Col xs={12}>
          <FormGroup bsSize="small" controlId="quantity" validationState={this.getFormValidationState("quantity")}>
            <Col xs={2} componentClass={ControlLabel}>
              Quantity <span style={{color: "red"}}>*</span>
            </Col>
            <Col xs={8}>
              <FormControl type="number" min={0} step={1}
                           name="quantity"
                           value={this.state.item.quantity}
                           onChange={this.handleItemFormChange}/>
              { this.state.errorNodes["quantity"] }
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

  getItemCreationForm() {
    return (
      <Form horizontal onSubmit={e => {e.preventDefault(); e.stopPropagation()}}>

        <FormGroup bsSize="small" controlId="name" validationState={this.getFormValidationState("name")}>
          <Col xs={2} componentClass={ControlLabel}>
            Name <span style={{color:"red"}}>*</span>
          </Col>
          <Col xs={8}>
            <FormControl type="text"
                         name="name"
                         value={this.state.item.name}
                         onChange={this.handleItemFormChange}/>
            { this.state.errorNodes["name"] }
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
            { this.state.errorNodes["description"] }
          </Col>
        </FormGroup>

        <FormGroup bsSize="small" controlId="tags" validationState={this.getFormValidationState("tags")}>
          <Col xs={2} componentClass={ControlLabel}>
            Tags
          </Col>
          <Col xs={8}>
            <TagMultiSelect tagsSelected={this.state.item.tags} tagHandler={this.handleTagSelection}/>
            { this.state.errorNodes["tags"] }
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

  showBulkImportForm(e){
    this.setState({
      showBulkImportModal: true
    })
  },

  displayBulkImportErrors(){
    var message = ""
    for (var key in this.state.bulkImportErrorNodes){
      message = message.concat("Errors in column: " + key + "\n\n")
      message = message.concat(this.state.bulkImportErrorNodes[key])
    }

    return(
      <pre style={{maxHeight:"300px", overflow:"auto"}}>
        {message}
      </pre>)
  },

  handleImportSubmit(e) {
    e.preventDefault()
    e.stopPropagation()

    var fd = new FormData();
    fd.append('data', this.state.importFile)
    var _this = this
    ajax({
      url: "/api/import/",
      type: "POST",
      data: fd,
      processData: false,
      contentType: false,
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.getAllItems()
        _this.setState({
          importFile: null,
          importResults: response,
          importSuccess: "File imported successfully",
          bulkImportErrorNodes: {},
          errorNodes: {}
        })
      },
      error:function (xhr, textStatus, thrownError){
        // console.log(xhr.responseJSON);
        // console.log(textStatus);
        // console.log(thrownError);
        // Logic to parse error
        var response = xhr.responseJSON
        var bulkErrNodes = JSON.parse(JSON.stringify(_this.state.bulkImportErrorNodes))
        var errNodes = JSON.parse(JSON.stringify(_this.state.errorNodes))
        errNodes['no_file'] = null
        for (var key in response) {
          if (response.hasOwnProperty(key)) {
            if (key == 'no_file'){
              errNodes[key] = response[key]
            }
            else {
              var message = ""
              for (var mess in response[key]){
                message = message.concat(response[key][mess])
                message = message.concat("\n")
                // console.log("Response[key][mess]:", response[key][mess])
              }
              // console.log("Message", message)
              bulkErrNodes[key] = message
              console.log(key)
              console.log(message)
            }
          }

        }
        _this.setState({
          errorNodes: errNodes,
          bulkImportErrorNodes: bulkErrNodes
        })



      }
    })
  },

  handleFileChange(e) {
    e.preventDefault();
    let reader = new FileReader();
    let file = e.target.files[0];
    reader.onloadend = () => {
      this.setState({
        importFile: file,
      });
    }

    reader.readAsDataURL(file)
  },

  render() {
    var bulkImportPanel = (this.props.route.user.is_superuser) ? (
      <Panel>
        <Row>
          <Col md={12} xs={6}>
            <p style={{fontSize:"12px"}}>
              Choose a .csv file from which to import items.
            </p>
            <p style={{fontSize:"12px"}}>
              Click <a href="/api/import/template/">here</a> to download a .csv file template.
            </p>
          </Col>
          <Col md={12} xs={6}>
            <Form onSubmit={this.handleImportSubmit}>
              <FormGroup bsSize="small">
                  <FormControl type="file" label="Choose file" style={{fontSize:"10px"}} bsStyle="default" onChange={this.handleFileChange} />
              </FormGroup>
              <Button style={{fontSize:"10px"}} type="submit" bsSize="small" bsStyle="info">Import</Button>
            </Form>
            <p style={{color: "red"}}>{this.state.errorNodes['no_file']}</p>
            <p style={{color: "#99ff99"}}>{this.state.importSuccess}</p>
          </Col>
          <Col md={12} xs={6}>
            <p style={{fontSize:"12px"}}>
              View Import Errors Below:
            </p>
            {this.displayBulkImportErrors()}
          </Col>
        </Row>
      </Panel>
    ) : null
    var inventoryPanelHeader = (this.props.route.user.is_staff || this.props.route.user.is_superuser) ? (
      <Row>
        <Col xs={12} >
          <span className="panel-title" style={{fontSize:"15px"}}>Current Inventory</span>
          <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showCreateItemForm}>
            Add Item &nbsp; <Glyphicon glyph="plus" />
          </Button>
          <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showBulkImportForm}>
            Bulk Import &nbsp; <Glyphicon glyph="plus" /> <Glyphicon glyph="plus" />
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
                    <Panel header={"Refine Results"}>
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
                                    onChange={this.handleIncludeTagSelection}
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
                </Row>
              </Col>
              <Col md={9} sm={12}>
                <div className="panel panel-default" >

                  <div className="panel-heading">
                    { inventoryPanelHeader }
                  </div>

                  <div className="panel-body" style={{minHeight:"460px"}}>

                    <Table condensed hover style={{marginBottom: "0px"}}>
                      <thead>
                        <tr>
                          <th style={{width:"25%"}} className="text-left">Item</th>
                          <th style={{width:"10%"}} className="text-center">Model No.</th>
                          <th style={{width:"10%"}} className="text-center">In Stock</th>
                          <th style={{width:"10%"}} className="text-center">Tags</th>
                          <th style={{width:"10%"}} className="text-center"/>
                          <th style={{width:"10%"}} className="text-center">Status</th>
                          <th style={{width:"5%"}}  className="spacer" />
                          <th style={{width:"8%" }} className="text-center">Quantity</th>
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
            { this.getItemCreationForm() }
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={e => {this.setState({showItemCreationModal: false})}}>Cancel</Button>
            <Button bsStyle="info" bsSize="small" onClick={this.createItem}>Create</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showBulkImportModal} onHide={e => {this.setState({showBulkImportModal: false})}}>
          <Modal.Header closeButton>
            <Modal.Title>Bulk Import of Items</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            { bulkImportPanel }
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={e => {this.setState({showBulkImportModal: false, errorNodes: {}, importSuccess: null, importFile: null, bulkImportErrorNodes:{}})}}>Cancel</Button>
          </Modal.Footer>
        </Modal>

      </Grid>
    )
  }
});

export default InventoryContainer
