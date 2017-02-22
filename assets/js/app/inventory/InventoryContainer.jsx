import React, { Component } from 'react'
import { Grid, Row, Col, Table, Image, Button, Panel, Label } from 'react-bootstrap'
import ItemView from './item/ItemView'
import { getJSON } from 'jquery'

const ITEMS_PER_PAGE = 100;

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
    };

    this.getItems = this.getItems.bind(this);
    this.getAllItems = this.getAllItems.bind(this);
    this.filterItems = this.filterItems.bind(this);

    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.handleExcludeTagSelection = this.handleExcludeTagSelection.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);

    this.getAllItems(); //maybe move to componentDidMount()
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

  handleSearch(text) {
    console.log("Search text: " + text);
    this.setState({searchText: text, page: 1}, () => {
      this.filterItems();
    });
  }

  handleTagSelection(tagsSelected) {
    console.log("tags: " + tagsSelected);
    this.setState({tagsSelected: tagsSelected, page: 1}, () => {
      this.filterItems();
    });
  }

  handleExcludeTagSelection(excludeTagsSelected) {
    console.log("ex tags: " + excludeTagsSelected);
    this.setState({excludeTagsSelected: excludeTagsSelected, page: 1}, () => {
      this.filterItems();
    });
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

  alertClicked(name) {
    alert("You clicked " + name + ".")
  }

  getItemStatus(item) {
    return (
      <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between"}}>
        <Label bsStyle="warning">Pending</Label>
        <Label bsStyle="success">In Cart</Label>
      </div>
    )
  }

  getItemRow(item, i) {
    return (
      <tr key={i}>
        <td data-th="Item Information">
          <Row>
            <div className="clickable" onClick={() => alert("hey")}>
              <Col sm={2} xsHidden>
                <Image src="http://placehold.it/100x100" rounded responsive/>
              </Col>
              <Col sm={8}>
                <h5>{item.name}</h5>
                <p>{item.description}</p>
              </Col>
            </div>
          </Row>
        </td>
        <td data-th="Status" className="text-center">
          {this.getItemStatus(item)}
        </td>
        <td data-th="Available" className="text-center">{item.quantity}</td>
        <td data-th="Quantity">
          <input type="number" className="form-control text-center" defaultValue="1" />
        </td>
        <td className="text-center" data-th="Action">
          <Button bsStyle="info">Add to Cart</Button>
        </td>
      </tr>
    )
  }

  render() {
    console.log(this.state.items)
    return (
      <Grid>
        <Row>
          <Col md={12}>
            <a href="/app/">
              <h4>Inventory</h4>
            </a>
            <hr />
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Table hover>
              <thead>
                <tr>
                  <th style={{width:"60%"}} className="text-left">Item Information</th>
                  <th style={{width:"10%"}} className="text-center">Status</th>
                  <th style={{width:"10%"}} className="text-center">Available</th>
                  <th style={{width:"10%"}} className="text-center">Quantity</th>
                  <th style={{width:"10%"}} className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {this.state.items.map( (item, i) => {
                  return this.getItemRow(item, i)
                })}
              </tbody>
            </Table>
          </Col>
        </Row>
      </Grid>
    )
  }
}

export default InventoryContainer
