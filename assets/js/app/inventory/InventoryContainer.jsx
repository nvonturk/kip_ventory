import React, { Component } from 'react'
import { Grid, Row, Col, Table, Image, Button, Panel, Label, Modal, HelpBlock,
         Glyphicon, Form, Pagination, FormGroup, FieldGroup, FormControl, Well,
        ControlLabel, InputGroup, Checkbox } from 'react-bootstrap'
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
      tags: [],
      custom_fields: [],

      tagsSelected: [],
      excludeTagsSelected: [],
      searchText: "",
      lowStock: false,

      page: 1,
      pageCount: 1,

      item: {
        name: "",
        model_no: "",
        quantity: 0,
        tags: [],
        description: "",
        custom_fields: []
      },

      showItemCreationModal: false,
      showBulkImportModal: false,

      errorNodes: {},
      bulkImportErrorNodes: {},
      importSuccess: null,

      importFile: null,

      showMinQuants: false,
      itemsMinQuants: [],
      showMinQuantsModal: false,
      newMinimumQuantity: 0,
      showMinQuantsErrorModal: false,
    }
  },

  componentWillMount() {
    this.getCustomFields();
    this.getItems(); //maybe move to componentDidMount()
    this.getAllTags();
  },

  getCustomFields() {
    var url = "/api/fields/"
    var _this = this
    var params = {"all": true}
    getJSON(url, params, function(data) {
      var custom_fields = data.results.map( (field, i) => {
        return ({"name": field.name, "value": "", "field_type": field.field_type})
      });
      _this.setState({
        custom_fields: custom_fields
      })
    })
  },

  getItems() {
    var url = "/api/items/";
    var _this = this;
    var params = {
      search: this.state.searchText,
      include_tags: this.state.tagsSelected,
      exclude_tags: this.state.excludeTagsSelected,
      low_stock: this.state.lowStock,
      page: this.state.page,
      itemsPerPage: ITEMS_PER_PAGE
    }
    getJSON(url, params, function(data) {
      var item = _this.state.item
      _this.setState({
        item: item,
        items: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
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
      this.getItems();
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
        browserHistory.push(itemURL)
      },
      // TODO : BETTER ERROR HANDLING. PARSE THE RESULT, AND ASSOCIATE WITH THE CORRECT FORM FIELD
      // USE THE <HelpBlock /> component to add subtext to the forms that failed the test.
      error:function (xhr, textStatus, thrownError){
        if (xhr.status == 400) {
          var response = xhr.responseJSON
          var errNodes = {}
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
    this.setState({tagsSelected: tagsSelected, page: 1}, this.getItems);
  },

  handleExcludeTagSelection(excludeTagsSelected) {
    excludeTagsSelected = excludeTagsSelected.map((tag, i) => {return tag.value}).join(",")
    this.setState({excludeTagsSelected: excludeTagsSelected, page: 1}, this.getItems);
  },

  handlePageSelect(activeKey) {
    this.setState({
      page: activeKey
    }, this.getItems);
  },

  handleLowStockSelection(e) {
    this.setState({
      lowStock: e.target.checked
    }, this.getItems);
  },

  handleMinQuantsSelection(e, item){
    var status = e.target.checked
    var newArray = this.state.itemsMinQuants.slice()
    var i = newArray.length
    while(i--){
      if(newArray[i].name == item.name && status == false){
        newArray.splice(i,1)
      } else if(newArray[i].name == item.name && status == true){
        //saying select item but item is already selected
        newArray.splice(i,1)
      }
    }

    if(status == true){
      newArray.push(item)
    }

    this.setState({
      itemsMinQuants: newArray,
    })
  },

  handleMinQuantsChange(e){
    e.preventDefault()
    this.setState({
      newMinimumQuantity: e.target.value,
    })
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
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       value={this.state.item[field_name]}
                       name={field_name}
                       onChange={this.handleItemFormChange} />
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getLongTextField(field_name, presentation_name, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="text"
                       style={{resize: "vertical", height:"100px"}}
                       componentClass={"textarea"}
                       value={this.state.item[field_name]}
                       name={field_name}
                       onChange={this.handleItemFormChange} />
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getIntegerField(field_name, presentation_name, min, step, i) {
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       min={min}
                       step={step}
                       value={this.state.item[field_name]}
                       name={field_name}
                       onChange={this.handleItemFormChange} />
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getFloatField(field_name, presentation_name, i){
    return (
      <FormGroup key={field_name} bsSize="small" validationState={this.getValidationState(field_name)}>
        <Col xs={2} componentClass={ControlLabel}>
          {presentation_name}
        </Col>
        <Col xs={8}>
          <FormControl type="number"
                       value={Number(this.state.item[field_name])}
                       name={field_name}
                       onChange={this.handleItemFormChange} />
          { this.state.errorNodes[field_name] }
        </Col>
      </FormGroup>
    )
  },

  getValidationState(field_name) {
    return (this.state.errorNodes[field_name] == null) ? null : "error"
  },

  getCustomFieldForms() {
    return this.state.custom_fields.map( (field, i) => {

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

  handleTagSelection(tagsSelected) {
    var item = this.state.item
    item.tags = tagsSelected.split(",")
    this.setState({
      item: item
    })
  },

  getItemCreationForm() {
    return (
      <Form onSubmit={this.createItem}>
        <Row>
          <Col xs={12}>
            <FormGroup bsSize="small" controlId="name" validationState={this.getValidationState("name")}>
              <ControlLabel>Name<span style={{color:"red"}}>*</span></ControlLabel>
              <FormControl type="text"
                           name="name"
                           value={this.state.item.name}
                           onChange={this.handleItemFormChange}/>
              { this.state.errorNodes['name'] }
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col md={6} xs={12}>
            <FormGroup bsSize="small" controlId="model_no" validationState={this.getValidationState('model_no')}>
              <ControlLabel>Model No.</ControlLabel>
              <FormControl type="text"
                           name="model_no"
                           value={this.state.item.model_no}
                           onChange={this.handleItemFormChange}/>
              { this.state.errorNodes['model_no'] }
            </FormGroup>
          </Col>
          <Col md={3} xs={12}>
            <FormGroup bsSize="small" controlId="quantity" validationState={this.getValidationState('quantity')}>
              <ControlLabel>Quantity<span style={{color:"red"}}>*</span></ControlLabel>
              <FormControl type="number"
                           name="quantity"
                           value={this.state.item.quantity}
                           onChange={this.handleItemFormChange}/>
              { this.state.errorNodes['quantity'] }
            </FormGroup>
          </Col>
          <Col md={3} xs={12}>
            <FormGroup bsSize="small" controlId="quantity" validationState={this.getValidationState('minimum_stock')}>
              <ControlLabel>Min Stock</ControlLabel>
              <FormControl type="number"
                           name="minimum_stock"
                           value={this.state.item.minimum_stock}
                           onChange={this.handleItemFormChange}/>
              { this.state.errorNodes['minimum_stock'] }
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <FormGroup bsSize="small" controlId="description">
              <ControlLabel>Description</ControlLabel>
              <FormControl type="text"
                           style={{resize: "vertical", height:"100px"}}
                           componentClass={"textarea"}
                           name="description"
                           value={this.state.item.description}
                           onChange={this.handleItemFormChange}/>
              { this.state.errorNodes['description'] }
            </FormGroup>
          </Col>
        </Row>

        <Row>
          <Col xs={12}>
            <FormGroup bsSize="small" controlId="tags">
              <ControlLabel>Tags</ControlLabel>
              <TagMultiSelect tagsSelected={this.state.item.tags} tagHandler={this.handleTagSelection}/>
              { this.state.errorNodes['tags'] }
            </FormGroup>
          </Col>
        </Row>

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

  openMinQuants(e){
    e.preventDefault();
    this.setState({
      showMinQuants: true
    })
  },

  hideMinQuants(e){
    e.preventDefault();
    this.setState({
      showMinQuants: false
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
        browserHistory.push("/app/inventory/")
      },
      error:function (xhr, textStatus, thrownError){
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
              }
              bulkErrNodes[key] = message
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


  //ditch this
  modifyMinQuants(e){
    e.preventDefault();
    if(this.state.itemsMinQuants.length == 0){
      this.setState({
        showMinQuantsErrorModal: true,
      })
    } else{
      this.setState({
        showMinQuantsModal: true,
      })
    }

  },

  implementMinQuantsMod(e){
    e.preventDefault();
    var newMin = parseInt(this.state.newMinimumQuantity)

    for (var i = 0 ; i < this.state.itemsMinQuants.length ; i++){
      var newItem = this.state.itemsMinQuants[i]
      newItem.minimum_stock = newMin;
      var url = "/api/items/" + newItem.name + "/"
      var data = newItem
      var _this = this
      var closeModal = true
      ajax({
        url: url,
        contentType: "application/json",
        type: "PUT",
        data: JSON.stringify(data),
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        success: function(response) {
          //this actively causes a race condition
          if(i == _this.state.itemsMinQuants.length){
            _this.setState({
              showMinQuantsModal : false
            })
          }
        },
        error: function(xhr, textStatus, thrownError) {
          i = _this.state.itemsMinQuants.length
          closeModal = false
          _this.setState({
            showMinQuantsModal : true
          })
          if (xhr.status == 400) {
            var response = xhr.responseJSON
            var errNodes = {}
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

    }

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

    var inventoryPanelHeaderButtons = (this.state.showMinQuants)   ? (
      <div>
        <span className="panel-title" style={{fontSize:"15px"}}>Current Inventory</span>
        <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.modifyMinQuants}>
        Modify Minimum Quantity
        </Button>
        <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.hideMinQuants}>
        Done
        </Button>
      </div>
    ) : (
      <div>
        <span className="panel-title" style={{fontSize:"15px"}}>Current Inventory</span>
        <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showCreateItemForm}>
          Add Item &nbsp; <Glyphicon glyph="plus" />
        </Button>
        <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.showBulkImportForm}>
          Bulk Import &nbsp; <Glyphicon glyph="plus" /> <Glyphicon glyph="plus" />
        </Button>
        <Button bsSize="small" bsStyle="primary" style={{fontSize:"10px", marginRight:"12px", float:"right", verticalAlign:"middle"}} onClick={this.openMinQuants}>
        Set Minimum Quantities
        </Button>
      </div>
    )

    var inventoryPanelHeader = (this.props.route.user.is_staff || this.props.route.user.is_superuser) ? (
      <Row>
        <Col xs={12} >
          {inventoryPanelHeaderButtons}
        </Col>
      </Row>
    ) : "Current Inventory"
    var minimumStockFilter = (this.props.route.user.is_staff || this.props.route.user.is_superuser) ? (
      <Form horizontal>
      <FormGroup bsSize="small">
        <Col xs={7} componentClass={ControlLabel} style={{textAlign: "left"}}>
          Show Low-Stock Items:
        </Col>
        <Col xs={2}>
          <Checkbox style={{paddingTop: "6px"}} onChange={this.handleLowStockSelection} />
        </Col>
      </FormGroup>
      </Form>
    ) : (
      null
    )

    var tableHeaders = (this.state.showMinQuants) ? (
      <tr>
        <th style={{width:"25%"}} className="text-left">Item</th>
        <th style={{width:"10%"}} className="text-center">Model No.</th>
        <th style={{width:"10%"}} className="text-center">In Stock</th>
        <th style={{width:"10%"}} className="text-center">Tags</th>
        <th style={{width:"10%"}} className="text-center"/>
        <th style={{width:"10%"}} className="text-center">Status</th>
        <th style={{width:"5%"}}  className="spacer" />
        <th style={{width:"20%" }} className="text-center">Modify Minimum Quantity</th>
      </tr>
    ) : (
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
    )
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
                            <ControlLabel>Search by item name or model number</ControlLabel>
                            <InputGroup bsSize="small">
                              <FormControl placeholder="Item name or model number"
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

                          { minimumStockFilter }

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

                        {tableHeaders}

                        <tr>
                          <th colSpan={9}>
                            <hr style={{margin: "auto"}} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.items.map( (item, i) => {
                          return (<InventoryItem key={item.name} item={item} minQuants={this.state.showMinQuants} boxChange={this.handleMinQuantsSelection} />)
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

        <Modal show={this.state.showMinQuantsModal} onHide={e => {this.setState({showMinQuantsModal: false})}}>
          <Modal.Header closeButton>
            <Modal.Title>Set The Minimum Quantity of Selected Items</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FormGroup bsSize="small" controlId="minimumquantity" validationState={this.getFormValidationState("minimum_stock")}>
              <Col xs={2} componentClass={ControlLabel}>
                Minimum Quantity <span style={{color: "red"}}>*</span>
              </Col>
              <Col xs={8}>
                <FormControl type="number" min={0} step={1}
                             name="newMinimumQuantity"
                             value={this.state.newMinimumQuantity}
                             onChange={e => this.handleMinQuantsChange(e)}/>
                { this.state.errorNodes["minimum_stock"] }
              </Col>
            </FormGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" onClick={e => {this.implementMinQuantsMod(e);}}>Modify Minimum Quantities</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={this.state.showMinQuantsErrorModal} onHide={e => {this.setState({showMinQuantsErrorModal: false})}}>
          <Modal.Header closeButton>
            <Modal.Title>Set The Minimum Quantity of Selected Items</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Please select items to modify their minimum stock quantity.
          </Modal.Body>
        </Modal>

      </Grid>
    )
  }
});

export default InventoryContainer
