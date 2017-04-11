import React, { Component } from 'react'
import { Grid, Row, Col, Button, Modal, Table, Form, Glyphicon, Pagination,
         FormGroup, FormControl, ControlLabel, HelpBlock, Panel, InputGroup,
         Label, Well, Badge, ListGroup, ListGroupItem } from 'react-bootstrap'
import { getJSON, ajax } from "jquery"
import { browserHistory } from 'react-router'
import Select from 'react-select'

import RequestedItemPanel from './RequestedItemPanel'

const RequestedItemsContainer = React.createClass({
  getInitialState() {
    return {
      requestedItems: this.props.requestedItems,

      expandedItem: null,
    }
  },

  toggleExpanded(index) {
    var cur = this.state.expandedItem
    if (cur == index) {
      this.setState({
        expandedItem: null
      })
    } else {
      this.setState({
        expandedItem: index
      })
    }
  },

  getRequestedItemListing() {
    return (this.props.requestedItems.length > 0) ? (
      <ListGroup style={{margin: "0px"}}>
        { this.props.requestedItems.map( (ri, i) => {
          return (
            <RequestedItemPanel key={ri.item}
                                requestedItem={ri}
                                hasAssets={this.props.itemAssets[ri.item]}
                                stock={this.props.itemQuantities[ri.item]}
                                handleModification={this.props.handleModification}
                                index={i}/>
          )
        })}
      </ListGroup>
    ) : (
      <Well style={{fontSize:"12px"}} bsSize="small" className="text-center">No items have been requested.</Well>
    )
  },

  render() {
    return this.getRequestedItemListing()
  },

})

export default RequestedItemsContainer
