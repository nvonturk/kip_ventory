import React, { Component } from 'react'
import { Form, Row, Col, FormGroup, ControlLabel, FormControl, HelpBlock, Modal,
         Button, Glyphicon, Well } from 'react-bootstrap'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import { ajax, getJSON } from 'jquery'
import AssetSelector from '../../inventory/detail/AssetSelector'

const ITEMS_PER_PAGE = 5

const CreateTransactionsContainer = React.createClass({
  getInitialState() {
    return {
      items: [],

      index: 0,

      assets: [],
      assetPage: 1,
      assetPageCount: 1,
      selectedAssets: [],

      quantity: 1,
      comment: "",
      category: "Acquisition",

      showModal: false
    }
  },

  componentWillMount() {
    this.getItems()
  },

  getItems() {
    var url = "/api/items/"
    var params = {
      all: true
    }
    var _this = this
    getJSON(url, params, function(data) {
      _this.setState({
        items: data.results
      }, _this.getAssets)
    })
  },

  getAssets() {
    var index = this.state.index
    if (this.state.items.length > 0) {
      if (this.state.items[index].has_assets) {
        var url = "/api/items/" + this.state.items[index].name + "/assets/"
        var params = {
          page: this.state.assetPage,
          itemsPerPage: ITEMS_PER_PAGE,
          status: "In Stock"
        }
        var _this = this
        getJSON(url, params, function(data) {
          _this.setState({
            assets: data.results,
            assetPageCount: Number(data.num_pages)
          })
        })
      }
    }
  },

  showModal() {
    this.setState({
      showModal: true
    })
  },

  hideModal() {
    this.setState({
      showModal: false,
      quantity: 1,
      comment: "",
      index: 0
    })
  },

  handleQuantityChange(e) {
    var q = Number(e.target.value)
    if (q < 0 || (q > this.state.items[this.state.index].quantity && this.state.category == "Loss")) {
      e.stopPropagation()
    } else {
      this.setState({
        quantity: q
      })
    }
  },

  handleCategoryChange(e) {
    var cat = e.target.value
    var q = this.state.quantity
    if (cat === "Loss" && q > this.state.items[this.state.index].quantity) {
      q = 0
    }
    this.setState({
      quantity: q,
      category: cat
    })
  },

  handleCommentChange(e) {
    this.setState({
      comment: e.target.value
    })
  },

  handleItemChange(e) {
    var ind = Number(e.target.value)
    this.setState({
      index: ind
    }, this.getAssets)
  },

  isAssetSelected(tag){
    for (var i = 0 ; i < this.state.selectedAssets.length ; i++) {
      if (this.state.selectedAssets[i].tag == tag) {
        return true
      }
    }
    return false
  },

  handleAssetSelection(e, index){
    var newArray = this.state.selectedAssets
    newArray.push(this.state.assets[index])
    this.setState({
      selectedAssets : newArray,
    })
  },

  handleAssetRemoval(e, index){
    var asset = this.state.assets[index]
    var newArray = this.state.selectedAssets
    for (var i=0; i<this.state.selectedAssets.length; i++) {
      if (this.state.selectedAssets[i].tag == asset.tag) {
        newArray.splice(i, 1)
      }
    }
    this.setState({
      selectedAssets: newArray,
    })
  },

  getItemOptions() {
    return this.state.items.map( (item, i) => {
        return (
          <option key={item.name} value={i}>{item.name}</option>
        )
      }
    )
  },

  allowLossTransaction(){
    if (this.state.items.length <= 0) {
      return false
    }
    if (this.state.selectedAssets.length < this.state.quantity && this.state.items[this.state.index].has_assets && this.state.category == "Loss"){
      return false;
    }
    if (this.state.transactionQuantity == 0){
      return false;
    }
    return true;
  },

  handlePageSelect(activePage) {
    this.setState({
      assetPage: activePage
    })
  },

  createTransaction(e) {
    e.preventDefault();
    e.stopPropagation();
    var _this = this
    var item = this.state.items[this.state.index]
    console.log(item)
    var data = {
      item: item.name,
      quantity: this.state.quantity,
      category: this.state.category,
      comment: this.state.comment
    }
    if (item.has_assets && this.state.category == "Loss"){
      data = {
        item: item.name,
        quantity: this.state.quantity,
        category: this.state.category,
        comment: this.state.comment,
        assets: this.state.selectedAssets.map((asset, i) => {return asset.tag}),
      }
    }
    ajax({
      url: "/api/transactions/",
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify(data),
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.setState({
          comment: "",
          quantity: 0,
          category: "Acquisition",
          showModal: false,
          selectedAssets: [],
          index: 0,
        }, function() {
          _this.getItems();
          _this.props.handleTransactionCreated();
        });
      },
      error:function (xhr, textStatus, thrownError){
        console.log(xhr)
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
    });
  },

  render() {
    var assetSelect = null
    if (this.state.items.length > 0) {
      if (this.state.items[this.state.index].has_assets && this.state.category == "Loss") {
        assetSelect = (
          <AssetSelector assets={this.state.assets}
                         selectedAssets={this.state.selectedAssets}
                         lossQuantity={this.state.quantity}
                         handleAssetRemoval={this.handleAssetRemoval}
                         handleAssetSelection={this.handleAssetSelection}
                         isAssetSelected={this.isAssetSelected}
                         pageCount={this.state.assetPageCount}
                         page={this.state.assetPage}
                         handlePageSelect={this.handlePageSelect}/>
        )
      }
    }
    var body = (this.state.items.length > 0) ? (
      <div>
        <Form horizontal onSubmit={e => {e.preventDefault(); e.stopPropagation();}}>
          <FormGroup bsSize="small" controlId="formControlsSelect">
            <Col xs={2} componentClass={ControlLabel}>
              Item
            </Col>
            <Col xs={10}>
              <FormControl componentClass="select" value={this.state.index} onChange={this.handleItemChange}>
                {this.getItemOptions()}
              </FormControl>
            </Col>
          </FormGroup>

          <FormGroup bsSize="small" controlId="formControlsText">
            <Col xs={2} componentClass={ControlLabel}>
              Quantity
            </Col>
            <Col xs={2}>
              <FormControl type="number" min={1} step={1} value={this.state.quantity} onChange={this.handleQuantityChange} />
            </Col>
            <Col xs={2} componentClass={ControlLabel}>
              Category
            </Col>
            <Col xs={4}>
              <FormControl componentClass="select" placeholder="select" value={this.state.category} onChange={this.handleCategoryChange}>
                <option value="Acquisition">Acquisition</option>
                <option value="Loss">Loss</option>
              </FormControl>
            </Col>
          </FormGroup>

          <FormGroup bsSize="small" controlId="formControlsText">
            <Col xs={2} componentClass={ControlLabel}>
              Comment
            </Col>
            <Col xs={10}>
            <FormControl type="text"
                         style={{resize: "vertical", height:"100px"}}
                         componentClass={"textarea"}
                         name="comment"
                         value={this.state.comment}
                         onChange={this.handleCommentChange}/>
            </Col>
          </FormGroup>
        </Form>
        { assetSelect }
      </div>
    ) : (
      <Well bsSize="small" className="text-center" style={{fontSize: "12px"}}>
        There are no items in the inventory. Please add an item to log an acquisition or loss.
      </Well>
    )
    return (
      <div>
        <Button bsSize="small" bsStyle="primary" style={{verticalAlign:"middle", fontSize:"10px"}} onClick={this.showModal}>
            Log an Acquisition or Loss &nbsp; <Glyphicon glyph="plus" />
        </Button>
        <Modal show={this.state.showModal} onHide={this.hideModal}>
          <Modal.Header closeButton>
            <Modal.Title>Log an Acquisition or Loss of Instances</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            { body }
          </Modal.Body>
          <Modal.Footer>
            <Button bsSize="small" bsStyle="default" onClick={this.hideModal}>Close</Button>
            <Button bsSize="small" bsStyle="info" disabled={!this.allowLossTransaction()} onClick={this.createTransaction}>Create</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

})


export default CreateTransactionsContainer
