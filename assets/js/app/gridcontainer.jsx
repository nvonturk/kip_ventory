import React, { Component } from 'react'
import InventoryGrid from './inventorygrid'
import InventoryGridHeader from './inventorygridheader'
import $ from "jquery"


class GridContainer extends Component {
  constructor(props) {
    super(props);
    // maybe make database call here to get items
    this.state = {items:[]};
    this.setItems = this.setItems.bind(this);
    this.getAllItems = this.getAllItems.bind(this);
    this.handleTagSearch = this.handleTagSearch.bind(this);

    this.getAllItems();

  }

  getAllItems() {
  	var thisobj = this;
  	$.getJSON("http://localhost:8000/api/items.json", function(data) {
  		thisobj.setItems(data);
  	});
  }

  handleTagSearch(text) {
    console.log(text);
    var thisobj = this;
    var url = "http://localhost:8000/api/items.json" + "?search=" + text;
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
        <InventoryGridHeader getAllItemsCallback={this.getAllItems} searchHandler={this.handleTagSearch} tagHandler={this.handleTagSearch}/>
      	<InventoryGrid items={this.state.items}></InventoryGrid>
      </div>
    );
  }
}


export default GridContainer