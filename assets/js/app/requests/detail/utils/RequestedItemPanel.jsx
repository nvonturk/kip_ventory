import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Badge, ListGroup, ListGroupItem, Checkbox } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { browserHistory } from 'react-router'
import Select from 'react-select'

const RequestedItemPanel = React.createClass({

  getInitialState() {
    return {
      assets: [],
      selectedAssets: [],

      showAssetSelectionModal: false,

      approved_item: {
        quantity: this.props.requestedItem.quantity,
        request_type: this.props.requestedItem.request_type,
        item: this.props.requestedItem.item
      },

      page: 1,
      pageCount: 1,

      search: "",

      hasAssets: this.props.hasAssets,
      stock: this.props.stock,
    }
  },

  componentWillReceiveProps(nextProps) {
    var _this = this
    this.setState({
      hasAssets: nextProps.hasAssets,
      stock: nextProps.stock,
    }, _this.getAssets)
  },

  getAssets() {
    if (this.state.hasAssets) {
      var _this = this;
      var url = "/api/items/" + this.props.requestedItem.item + "/assets/";
      var params = {
        status: "In Stock",
        search: this.state.search,
        page: this.state.page,
        itemsPerPage: 5
      };
      getJSON(url, params, function(data) {
        _this.setState({
          assets: data.results,
          pageCount: Number(data.num_pages)
        })
      })
    }
  },

  handleAssetSearch(e) {
    e.stopPropagation()
    var _this = this
    this.setState({
      search: e.target.value
    }, _this.getAssets)
  },

  handlePageSelect(page) {
    var _this = this
    this.setState({
      page: page
    }, _this.getAssets)
  },

  handleQuantityChange(e) {
    e.stopPropagation()
    var q = Number(e.target.value)
    if (q <= this.state.stock && q > 0) {
      var newAssets = this.state.selectedAssets
      if (q < this.state.selectedAssets.length) {
        newAssets = []
      }
      var ai = this.state.approved_item
      var assets = (this.props.hasAssets) ? this.state.selectedAssets : null
      ai['quantity'] = q
      this.setState({
        approved_item: ai,
        selectedAssets: newAssets,
      }, () => {this.props.clearErrors(this.state.approved_item.item); this.props.handleModification(this.props.index, this.state.approved_item, assets);})
    }
  },

  handleTypeChange(e) {
    e.stopPropagation()
    var ai = this.state.approved_item
    var assets = (this.props.hasAssets) ? this.state.selectedAssets : null
    ai['request_type'] = e.target.value
    this.setState({
      approved_item: ai,
    }, () => {this.props.clearErrors(this.state.approved_item.item); this.props.handleModification(this.props.index, this.state.approved_item, assets)})
  },

  getExpandChevron() {
    return (this.props.expanded === this.props.index) ? (
      <Glyphicon style={{fontSize:"12px"}} glyph="chevron-up" />
    ) : (
      <Glyphicon style={{fontSize:"12px"}} glyph="chevron-down" />
    )
  },

  getPanelStyle() {
    return (this.props.index === this.props.expanded) ? (
      {margin:"10px 0px", boxShadow: "0px 0px 5px 2px #485563"}
    ) : (
      {margin:"0px"}
    )
  },

  isAssetSelected(tag) {
    for (var i=0; i<this.state.selectedAssets.length; i++) {
      if (this.state.selectedAssets[i] === tag) {
        return true
      }
    }
    return false
  },

  handleAssetSelection(index, e) {
    var asset = this.state.assets[index]
    var selectedAssets = JSON.parse(JSON.stringify(this.state.selectedAssets))
    if (!this.isAssetSelected(asset.tag)) {
      selectedAssets.push(asset.tag)
      this.setState({
        selectedAssets: selectedAssets
      }, () => {this.props.clearErrors(this.state.approved_item.item); this.props.handleModification(this.props.index, this.state.approved_item, this.state.selectedAssets)})
    }
  },

  handleAssetRemoval(index, e) {
    var asset = this.state.assets[index]
    var newSelected = []
    for (var i=0; i<this.state.selectedAssets.length; i++) {
      if (this.state.selectedAssets[i] != asset.tag) {
        newSelected.push(this.state.selectedAssets[i])
      }
    }
    this.setState({
      selectedAssets: newSelected
    }, () => {this.props.clearErrors(this.state.approved_item.item); this.props.handleModification(this.props.index, this.state.approved_item, this.state.selectedAssets)})
  },

  showAssetSelectionModal(e) {
    this.setState({
      showAssetSelectionModal: true
    })
  },

  hideAssetSelectionModal(e) {
    this.setState({
      showAssetSelectionModal: false
    })
  },

  getSelectionErrorStyle() {
    return (this.props.errors[this.state.approved_item.item] == null) ? (
      {fontSize: "10px", display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}
    ) : (
      {fontSize: "10px", display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center", border: "1px solid red"}
    )
  },

  render() {
    var assetPanel = null
    if (this.props.hasAssets) {
      var assetOrAssets = (this.state.approved_item.quantity == 1) ? ("asset") : ("assets")
      assetPanel = (
        <div>
          <Row style={{display:"flex", zIndex: 1}}>
            <Col xs={2} style={{paddingLeft:"0px", display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "left"}}>
              <a style={{fontSize:"14px", color: "#df691a"}} href={"/app/inventory/" + this.props.requestedItem.item + "/"}>
                { this.props.requestedItem.item }
              </a>
            </Col>
            <Col xs={7} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
              <Form horizontal>
                <Col xs={3} componentClass={ControlLabel}>
                  Qty:
                </Col>
                <Col xs={2}>
                  <FormGroup bsSize="small" style={{marginBottom: "0px", zIndex: 9999}}>
                    <FormControl type="number" min={1} className="text-center"
                                 style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                                 value={this.state.approved_item.quantity}
                                 onChange={this.handleQuantityChange}
                                 onClick={e => {e.stopPropagation()}}>
                    </FormControl>
                  </FormGroup>
                </Col>
                <Col xs={3} componentClass={ControlLabel}>
                  Type:
                </Col>
                <Col xs={4}>
                  <FormGroup bsSize="small" style={{marginBottom: "0px", zIndex: 9999}}>
                    <FormControl className="text-center"
                                 style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                                 componentClass="select"
                                 value={this.state.approved_item.request_type}
                                 onChange={this.handleTypeChange}
                                 onClick={e => {e.stopPropagation()}}>
                      <option value="disbursement">Disbursement</option>
                      <option value="loan">Loan</option>
                    </FormControl>
                  </FormGroup>
                </Col>
              </Form>
            </Col>
            <Col xs={2} style={this.getSelectionErrorStyle()}>
              {this.state.selectedAssets.length} of {this.state.approved_item.quantity} assets selected.
            </Col>
            <Col xs={1} style={{fontSize: "12px", display: "flex", flexDirection:"column", justifyContent: "center"}}>
              <span style={{color: "rgb(91, 192, 222)", textDecoration: "underline"}} className="clickable" onClick={this.showAssetSelectionModal}>
                Select
              </span>
            </Col>
          </Row>

          <Modal show={this.state.showAssetSelectionModal} onHide={this.hideAssetSelectionModal}>
            <Modal.Header closeButton>
              <Modal.Title>Select {this.state.approved_item.quantity} {assetOrAssets}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row>
              <Col xs={12}>
              <Table condensed hover>
                <thead>
                  <tr>
                    <th style={{width: "65%", borderBottom: "1px solid #596a7b"}} className="text-left">Asset Tag</th>
                    <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center">Selected?</th>
                    <th style={{width: " 5%", borderBottom: "1px solid #596a7b"}} className="spacer"></th>
                    <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center"></th>
                    <th style={{width: "10%", borderBottom: "1px solid #596a7b"}} className="text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  { this.state.assets.map( (asset, i) => {
                    var isSelected = <Label bsSize="small" bsStyle="danger" style={{fontSize:"10px"}}>No</Label>
                    var selectOrDeselect = "Select"
                    if (this.isAssetSelected(asset.tag)) {
                      isSelected = <Label bsSize="small" bsStyle="success" style={{fontSize:"10px"}}>Yes</Label>
                      selectOrDeselect = "Deselect"
                    }
                    return (
                      <tr key={asset.tag} >
                        <td data-th="Asset Tag" className="text-left">
                          <h6 style={{color: "#df691a"}}>{asset.tag}</h6>
                        </td>
                        <td data-th="Selected?" className="text-center">
                          {isSelected}
                        </td>
                        <td data-th="" className="spacer" />
                        <td data-th="" className="text-center">
                          <Button bsSize="small" bsStyle="info"
                                  onClick={this.handleAssetSelection.bind(this, i)}
                                  disabled={((this.state.approved_item.quantity == this.state.selectedAssets.length) || this.isAssetSelected(asset.tag))}>
                            Select
                          </Button>
                        </td>
                        <td data-th="" className="text-center">
                          <Button bsSize="small" bsStyle="danger"
                                  onClick={this.handleAssetRemoval.bind(this, i)}
                                  disabled={!this.isAssetSelected(asset.tag)}>
                            Deselect
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
              <Pagination next prev maxButtons={3}
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.pageCount}
                          activePage={this.state.page}
                          onSelect={this.handlePageSelect}/>
              </Col>
              </Row>
            </Modal.Body>
          </Modal>

        </div>
      )
    } else {
      assetPanel = (
        <Row style={{display:"flex", zIndex: 1}}>
          <Col xs={2} style={{paddingLeft: "0px", display: "flex", flexDirection:"column", justifyContent: "center"}}>
            <a style={{fontSize:"14px", color: "#df691a"}} href={"/app/inventory/" + this.props.requestedItem.item + "/"}>
              { this.props.requestedItem.item }
            </a>
          </Col>
          <Col xs={7} style={{display: "flex", flexDirection:"column", justifyContent: "center", textAlign: "center"}}>
            <Form horizontal>
              <Col xs={3} componentClass={ControlLabel}>
                Qty:
              </Col>
              <Col xs={2}>
                <FormGroup bsSize="small" style={{marginBottom: "0px", zIndex: 9999}}>
                  <FormControl type="number" min={1} className="text-center"
                               style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                               value={this.state.approved_item.quantity}
                               onChange={this.handleQuantityChange}
                               onClick={e => {e.stopPropagation()}}>
                  </FormControl>
                </FormGroup>
              </Col>
              <Col xs={3} componentClass={ControlLabel}>
                Type:
              </Col>
              <Col xs={4}>
                <FormGroup bsSize="small" style={{marginBottom: "0px", zIndex: 9999}}>
                  <FormControl className="text-center"
                               style={{fontSize:"10px", height:"30px", lineHeight:"30px"}}
                               componentClass="select"
                               value={this.state.approved_item.request_type}
                               onChange={this.handleTypeChange}
                               onClick={e => {e.stopPropagation()}}>
                    <option value="disbursement">Disbursement</option>
                    <option value="loan">Loan</option>
                  </FormControl>
                </FormGroup>
              </Col>
            </Form>
          </Col>
        </Row>
      )
    }
    return (
      <ListGroupItem style={{borderTop: "1px solid #596a7b", borderBottom: "1px solid #596a7b"}}>
        { assetPanel }
      </ListGroupItem>
    );
  }
});

export default RequestedItemPanel
