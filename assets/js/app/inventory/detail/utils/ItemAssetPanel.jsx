import React from 'react'
import { Grid, Row, Col, Tabs, Tab, Nav, NavItem, Button, Modal, Table, Form, FormGroup, InputGroup, FormControl, Pagination, ControlLabel, Glyphicon, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../../csrf/DjangoCSRFToken'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../../TagMultiSelect'
import Select from 'react-select'

import AssetModal from './AssetModal'

const ITEMS_PER_PAGE = 5;

const ItemAssetPanel = React.createClass({
  getInitialState() {
    return {
      item: {},
      assets: [],

      assetToShow: null,

      assetsPage: 1,
      assetsPageCount: 1,

      assetFilterStatus: "",
      assetTagSearch: ""
    }
  },

  componentWillReceiveProps(nextProps) {
    var _this = this;
    this.setState({item: nextProps.item}, _this.getAssets)
  },

  getAssets() {
    var url = "/api/items/" + this.state.item.name + "/assets/"
    var params = {
      page: this.state.assetsPage,
      itemsPerPage: ITEMS_PER_PAGE,
      status: this.state.assetFilterStatus,
      search: this.state.assetTagSearch
    }
    var _this = this;
    if (this.state.item.has_assets) {
      getJSON(url, params, function(data) {
        _this.setState({
          assets: data.results,
          assetsPageCount: Number(data.num_pages),
        })
      })
    }
  },

  getAssetStatus(asset) {
    if (asset.status == "In Stock") {
      return (<Label bsSize="small" bsStyle="success" style={{fontSize: "10px"}}>In Stock</Label>)
    } else if (asset.status == "Loaned") {
      return (<Label bsSize="small" bsStyle="warning" style={{fontSize: "10px"}}>Loaned</Label>)
    } else if (asset.status == "Disbursed") {
      return (<Label bsSize="small" bsStyle="primary" style={{fontSize: "10px"}}>Disbursed</Label>)
    } else if (asset.status == "Lost") {
      return (<Label bsSize="small" bsStyle="danger" style={{fontSize: "10px"}}>Lost</Label>)
    }
  },

  showAssetModal(asset, index) {
    this.setState({
      showAssetModal: true,
      assetToShow: JSON.parse(JSON.stringify(asset))
    })
  },

  closeAssetModal() {
    this.setState({
      showAssetModal: false,
      assetToShow: null
    })
  },

  updateCurrentAsset() {
    var url = "/api/items/" + this.state.item.name + "/assets/" + this.state.assetToShow.tag + "/"
    var _this = this
    getJSON(url, null, function(data) {
      _this.setState({
        assetToShow: data
      })
    })
  },

  refreshAssets(e) {
    this.getAssets()
    this.updateCurrentAsset()
    this.props.refresh()
  },

  assetEditRefresh(e){
    this.getAssets()
    this.props.refresh()
    this.closeAssetModal()
  },


  handleAssetStatusSelection(e) {
    this.setState({
      assetFilterStatus: e.target.value,
      assetsPage: 1
    }, this.getAssets)
  },

  handleTagSearch(e) {
    this.setState({
      assetTagSearch: e.target.value,
      assetsPage: 1
    }, this.getAssets)
  },

  getItemAssetPanel() {
    var assetTableView = (this.state.assets.length > 0) ? (
      <Table condensed hover>
        <thead>
          <tr>
            <th style={{width: "80%", borderBottom: "1px solid #596a7b"}} className="text-left">Tag</th>
            <th style={{width: "20%", borderBottom: "1px solid #596a7b"}} className="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          { this.state.assets.map( (asset, i) => {
            return (
              <tr key={asset.tag} className="clickable" onClick={this.showAssetModal.bind(this, asset, i)}>
                <td data-th="Asset ID" className="text-left">
                  <h6 style={{color: "#df691a"}}>{asset.tag}</h6>
                </td>
                <td data-th="Status" className="text-center">
                  { this.getAssetStatus(asset) }
                </td>
              </tr>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <Well bsSize="small" className="text-center" style={{fontSize:"12px"}}>No results.</Well>
    )
    return (this.state.item.has_assets) ? (
      <div className="panel panel-default">

        <div className="panel-heading">
          <span style={{fontSize:"15px"}}>
            Tracked Assets
          </span>
        </div>

        <div className="panel-body" style={{minHeight:"317px"}}>
          <Row>
            <Col xs={12}>
              <Form>
                <FormGroup bsSize="small">
                  <ControlLabel>
                    Search by asset tag
                  </ControlLabel>
                  <InputGroup bsSize="small">
                    <FormControl placeholder="Search by asset tag"
                                 style={{fontSize:"12px"}}
                                 type="text" name="assetTagSearch"
                                 value={this.state.assetTagSearch}
                                 onChange={this.handleTagSearch}/>
                    <InputGroup.Addon style={{backgroundColor: "#df691a"}} className="clickable" onClick={this.handleTagSearch}>
                      <Glyphicon glyph="search"/>
                    </InputGroup.Addon>
                  </InputGroup>
                </FormGroup>
                <FormGroup bsSize="small">
                  <ControlLabel>
                    Filter by asset status
                  </ControlLabel>
                  <FormControl componentClass="select"
                               name="assetFilterStatus"
                               style={{fontSize:"12px"}}
                               placeholder="Filter by asset status"
                               value={this.state.assetFilterStatus}
                               onChange={this.handleAssetStatusSelection}>
                    <option value=''>Show all assets</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Loaned">Loaned</option>
                    <option value="Disbursed">Disbursed</option>
                    <option value="Lost">Lost</option>
                  </FormControl>
                </FormGroup>
              </Form>
            </Col>
          </Row>

          <Row>
            <Col xs={12}>
              { assetTableView }
            </Col>
          </Row>
        </div>

        <div className="panel-footer">
          <Row>
            <Col md={12}>
              <Pagination first last next prev maxButtons={3}
                          ellipsis style={{float:"right", margin: "0px"}}
                          bsSize="small" items={this.state.assetsPageCount}
                          activePage={this.state.assetsPage}
                          onSelect={activeKey => {this.setState({assetsPage: activeKey}, this.getAssets)}}/>
            </Col>
          </Row>
        </div>

        <AssetModal show={this.state.showAssetModal}
                    onHide={this.closeAssetModal}
                    asset={this.state.assetToShow}
                    refresh={this.refreshAssets}
                    assetRefresh={this.assetEditRefresh}
                    user={this.props.user}/>

      </div>
    ) : (
      null
    )
  },

  render() {
    return this.getItemAssetPanel()
  }
})

export default ItemAssetPanel
