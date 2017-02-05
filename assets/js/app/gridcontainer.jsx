import React, { Component } from 'react'
import InventoryGrid from './inventorygrid'
import InventoryGridHeader from './inventorygridheader'
import Paginator from './paginator'
import $ from "jquery"

const ITEMS_PER_PAGE = 1;

class GridContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items:[],
      tagsSelected: [],
      excludeTagsSelected: [],
      user: {},
      searchText: "",
      page: 1,
      pageCount: 0,
    };

    this.getItems = this.getItems.bind(this);
    this.getAllItems = this.getAllItems.bind(this);
    this.filterItems = this.filterItems.bind(this);

    this.setCurrentUser = this.setCurrentUser.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);

    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.handleExcludeTagSelection = this.handleExcludeTagSelection.bind(this);
    this.handlePageClick = this.handlePageClick.bind(this);

    this.getAllItems(); //maybe move to componentDidMount()
    this.getCurrentUser();

  }

  getItems(params) {
    var url = "/api/items.json";
    var thisobj = this;
    $.getJSON(url, params, function(data) {
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


  getCurrentUser() {
    var thisobj = this;
    $.getJSON("/api/currentuser.json", function(data) {
      thisobj.setCurrentUser(data)
    });
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

  setCurrentUser(user){
    // We have to access user[0] because we're using the ListModelMixin in the CurrentUserView
    // ListModelMixin is configured to return an array, even if it only contains a single element
    // I'm sure we can find a way to use the RetrieveModelMixin instead, which will return a single JSON object.
    this.setState({
      user: user[0]
    })
  }

  handlePageClick(data) {
    let selected = data.selected;
    let offset = Math.ceil(selected * ITEMS_PER_PAGE);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.filterItems();
    });
  }

  render() {
    return (
      <div>
        <InventoryGridHeader searchHandler={this.handleSearch} tagHandler={this.handleTagSelection} tagsSelected={this.state.tagsSelected} excludeTagHandler={this.handleExcludeTagSelection} excludeTagsSelected={this.state.excludeTagsSelected}/>
      	<InventoryGrid items={this.state.items} user={this.state.user}></InventoryGrid>
        <Paginator pageCount={this.state.pageCount} onPageChange={this.handlePageClick} forcePage={this.state.page - 1}/>
      </div>
    );
  }
}


export default GridContainer
