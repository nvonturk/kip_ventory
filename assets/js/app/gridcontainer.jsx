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
      user: {},
      searchText: ""
    };

    this.getItems = this.getItems.bind(this);
    this.setItems = this.setItems.bind(this);

    this.setCurrentUser = this.setCurrentUser.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);

    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.filterItems = this.filterItems.bind(this);

    this.getItems();
    this.getCurrentUser();
  }

  getItems() {
  	var thisobj = this;

  	$.getJSON("/api/items.json", function(data) {
      console.log(data);
  		thisobj.setItems(data);
  	});

  }

  getCurrentUser() {
    var thisobj = this;
    $.getJSON("/api/currentuser.json", function(data) {
      thisobj.setCurrentUser(data)
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

  setCurrentUser(user){
    // We have to access user[0] because we're using the ListModelMixin in the CurrentUserView
    // ListModelMixin is configured to return an array, even if it only contains a single element
    // I'm sure we can find a way to use the RetrieveModelMixin instead, which will return a single JSON object.
    this.setState({
      user: user[0]
    })
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
