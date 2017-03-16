import React, { Component } from 'react'
import { Grid, Row, Col, Table, Image, Button, Panel, Label, Glyphicon, Form, FormGroup, FormControl, ControlLabel, InputGroup } from 'react-bootstrap'
import InventoryItem from './InventoryItem'
import InventoryGridHeader from './InventoryGridHeader'
import Paginator from '../Paginator'
import { getJSON } from 'jquery'
import { browserHistory } from 'react-router';

import Select from 'react-select';
import 'react-select/dist/react-select.css';


const ITEMS_PER_PAGE = 5;

class InventoryContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items:[],
      tagsSelected: [],
      excludeTagsSelected: [],
      searchText: "",
      page: 1,
      pageCount: 0,
      tags: []
    };

    this.getItems = this.getItems.bind(this);
    this.getAllItems = this.getAllItems.bind(this);
    this.filterItems = this.filterItems.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.handleExcludeTagSelection = this.handleExcludeTagSelection.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.getAllTags = this.getAllTags.bind(this);

    this.getAllItems(); //maybe move to componentDidMount()
    this.getAllTags();
  }

  getItems(params) {
    var url = "/api/items/";
    var thisobj = this;
    getJSON(url, params, function(data) {
      thisobj.setState({
        items: data.results,
        pageCount: Math.ceil(data.num_pages),
      });
    });
  }

  getAllItems() {
    var params = {
      page: 1,
      itemsPerPage: ITEMS_PER_PAGE
    }

    this.getItems(params);
  }

  filterItems() {
    var params = {
      search: this.state.searchText,
      tags: this.state.tagsSelected,
      excludeTags: this.state.excludeTagsSelected,
      page: this.state.page,
      itemsPerPage: ITEMS_PER_PAGE
    }
    this.getItems(params);
  }

  getAllTags() {
    var url = "/api/tags/"
    var params = {"all": true}
    var _this = this;
    getJSON(url, params, function(data) {
      data = data.map( (tag, i) => {return {value: tag.name, label: tag.name}})
      _this.setState({tags: data})
    })
  }

  handleSearch(e) {
    e.preventDefault()
    this.setState({page: 1}, () => {
      this.filterItems();
    });
  }

  handleTagSelection(tagsSelected) {
    tagsSelected = tagsSelected.map((tag, i) => {return tag.value}).join(",")
    this.setState({tagsSelected: tagsSelected, page: 1}, this.filterItems);
  }

  handleExcludeTagSelection(excludeTagsSelected) {
    excludeTagsSelected = excludeTagsSelected.map((tag, i) => {return tag.value}).join(",")
    this.setState({excludeTagsSelected: excludeTagsSelected, page: 1}, this.filterItems);
  }

  handlePageClick(data) {
    let selected = data.selected;
    let offset = Math.ceil(selected * ITEMS_PER_PAGE);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.filterItems();
    });
  }

  handleChangeQuantity(index, quantity) {
    this.setState(function(prevState, props) {
      prevState.items[index].quantity = parseInt(prevState.items[index].quantity) + parseInt(quantity);
      return {
        items: prevState.items
      };
    });
  }

  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  render() {
    return (
      <Grid>
        <Row>
          <Col xs={12}>
            <Row >
              <Col xs={12}>
                <h3>Inventory List</h3>
                <hr />
              </Col>
            </Row>

            <Row>
              <Col sm={3}>
                <Panel>
                  <Row>
                    <Col sm={12}>
                      <h4>Refine Results</h4>
                      <hr />
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={12}>
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
                                onChange={this.handleTagSelection}
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

              <Col sm={9}>
                <Panel>
                  <Table condensed hover style={{marginBottom: "0px"}}>
                    <thead>
                      <tr>
                        <th style={{width:"40%"}} className="text-left">Item Information</th>
                        <th style={{width:"10%"}} className="text-center">Model No.</th>
                        <th style={{width:"10%"}} className="text-center">Available</th>
                        <th style={{width:"10%"}} className="text-left">Tags</th>
                        <th style={{width:"10%"}} className="text-center"></th>
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
                </Panel>
              </Col>
            </Row>
            <Row>
              <Col sm={4} smOffset={4}>
                <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
              </Col>
            </Row>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default InventoryContainer
