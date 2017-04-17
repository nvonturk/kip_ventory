import React, { Component } from 'react'
import { Grid, Row, Col, Tabs, Tab, Nav, NavItem, Button, Modal, Table, Form, FormGroup, InputGroup, FormControl, Pagination, ControlLabel, Glyphicon, HelpBlock, Panel, Label, Well }  from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import {browserHistory} from 'react-router'
import TagMultiSelect from '../../TagMultiSelect'
import Select from 'react-select'
import LoanModal from '../../loans/LoanModal'

import ItemInfoPanel from './utils/ItemInfoPanel'
import ItemStacksPanel from './utils/ItemStacksPanel'
import ItemAssetPanel from './utils/ItemAssetPanel'


const ITEMS_PER_PAGE = 5;

const AssetSelector = React.createClass({
  getInitialState() {
    return {

    }
  },

  render() {

    return(
      <div>
        <p>
        {this.props.selectedAssets.length} out of {this.props.lossQuantity} Assets Selected
        </p>
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
            { this.props.assets.map( (asset, i) => {
              var isSelected = <Label bsSize="small" bsStyle="danger" style={{fontSize:"10px"}}>No</Label>
              var selectOrDeselect = "Select"
              if (this.props.isAssetSelected(asset.tag)) {
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
                            onClick={(e) => {this.props.handleAssetSelection(e, i)} }
                            disabled={((this.props.lossQuantity == this.props.selectedAssets.length) || this.props.isAssetSelected(asset.tag))}>
                      Select
                    </Button>
                  </td>
                  <td data-th="" className="text-center">
                    <Button bsSize="small" bsStyle="danger"
                            onClick={ (e) => {this.props.handleAssetRemoval(e, i)} }
                            disabled={!this.props.isAssetSelected(asset.tag)}>
                      Deselect
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>



      </div>
    );

    // <Pagination next prev maxButtons={3} boundaryLinks
    //             ellipsis style={{float:"right", margin: "0px"}}
    //             bsSize="small" items={this.props.pageCount}
    //             activePage={this.props.page}
    //             onSelect={activeKey => {this.props.handlePageSelect(activeKey)} }/>






  }

})

export default AssetSelector
