import React, { Component } from 'react'
import InventoryGrid from './inventorygrid'
import InventoryGridHeader from './inventorygridheader'
import $ from "jquery"


class GridContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items:[],
      tagsSelected: []
    };
    this.setItems = this.setItems.bind(this);
    this.getAllItems = this.getAllItems.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);

    this.getAllItems();
  }

  getAllItems() {
  	var thisobj = this;
  	$.getJSON("http://localhost:8000/api/items.json", function(data) {
  		thisobj.setItems(data);
  	});
  }

  handleSearch(text) {
    console.log(text);
    var thisobj = this;
    var url = "http://localhost:8000/api/items.json" + "?search=" + text;
  	$.getJSON(url, function(data) {
  		thisobj.setItems(data);
  	});
  }

  handleTagSelection(value) {
    console.log("tag: " + value);
    this.setState({tagsSelected: value});
    var thisobj = this;
    var url = "http://localhost:8000/api/items.json" + "?tags=" + value;
    $.getJSON(url, function(data) {
      thisobj.setItems(data);
    });
  }

  setItems(items) {
  	this.setState({
  		items: items
  	});
  }

  render() {
    return (
      <div>
        <InventoryGridHeader getAllItemsCallback={this.getAllItems} searchHandler={this.handleSearch} tagHandler={this.handleTagSelection} tagsSelected={this.state.tagsSelected}/>
      	<InventoryGrid items={this.state.items}></InventoryGrid>
      </div>
    );
  }
}


export default GridContainer