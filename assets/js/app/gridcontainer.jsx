import React, { Component } from 'react'
import InventoryGrid from './inventorygrid'
import InventoryGridHeader from './inventorygridheader'
import $ from "jquery"


class GridContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items:[],
      tagsSelected: [],
      user: props.user,
      searchText: ""
    };

    this.getItems = this.getItems.bind(this);
    this.setItems = this.setItems.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.filterItems = this.filterItems.bind(this);

    this.getItems();
  }

  getItems() {
  	var thisobj = this;

  	$.getJSON("/api/items.json", function(data) {
  		thisobj.setItems(data);
  	});

  }

  handleSearch(text) {
    console.log("Search text: " + text);
    this.setState({searchText: text});
    this.filterItems(text, this.state.tagsSelected);
  }

  handleTagSelection(tagsSelected) {
    console.log("tag: " + tagsSelected);
    this.setState({tagsSelected: tagsSelected});
    this.filterItems(this.state.searchText, tagsSelected);
  }

  filterItems(search, tags) {
    var url = "/api/items.json" + "?search=" + search + "&tags=" + tags;
    console.log(url)

    var thisobj = this;
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
        <InventoryGridHeader searchHandler={this.handleSearch} tagHandler={this.handleTagSelection} tagsSelected={this.state.tagsSelected}/>
      	<InventoryGrid items={this.state.items} user={this.state.user}></InventoryGrid>
      </div>
    );
  }
}


export default GridContainer
