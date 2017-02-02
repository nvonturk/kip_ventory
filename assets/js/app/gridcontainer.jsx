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
    };

    this.getItems = this.getItems.bind(this);
    this.setItems = this.setItems.bind(this);

    this.setCurrentUser = this.setCurrentUser.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);

    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);

    this.getItems();
    this.getCurrentUser();
  }


  getItems() {
  	var thisobj = this;

  	$.getJSON("/api/items.json", function(data) {
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
    console.log(text);
    var thisobj = this;
    var url = "/api/items.json" + "?search=" + text;
  	$.getJSON(url, function(data) {
  		thisobj.setItems(data);
  	});
  }

  handleTagSelection(value) {
    console.log("tag: " + value);
    this.setState({tagsSelected: value});
    var thisobj = this;
    var url = "/api/items.json" + "?tags=" + value;
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
        <InventoryGridHeader getAllItemsCallback={this.getItems} searchHandler={this.handleSearch} tagHandler={this.handleTagSelection} tagsSelected={this.state.tagsSelected}/>
      	<InventoryGrid items={this.state.items} user={this.state.user}></InventoryGrid>
      </div>
    );
  }
}


export default GridContainer
