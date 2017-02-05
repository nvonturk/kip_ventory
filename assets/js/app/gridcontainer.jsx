import React, { Component } from 'react'
import InventoryGrid from './inventorygrid'
import InventoryGridHeader from './inventorygridheader'
import ReactPaginate from 'react-paginate';
import $ from "jquery"


class GridContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items:[],
      tagsSelected: [],
      excludeTagsSelected: [],
      user: {},
      searchText: "",
      page: 0,
      pageCount:0
    };

    this.getItems = this.getItems.bind(this);

    this.setCurrentUser = this.setCurrentUser.bind(this);
    this.getCurrentUser = this.getCurrentUser.bind(this);

    this.handleSearch = this.handleSearch.bind(this);
    this.handleTagSelection = this.handleTagSelection.bind(this);
    this.handleExcludeTagSelection = this.handleExcludeTagSelection.bind(this);

    this.handlePageClick = this.handlePageClick.bind(this);
    this.filterItems = this.filterItems.bind(this);

    this.getItems(); //maybe move to componentDidMount()
    this.getCurrentUser();

    this.perPage = 3;
  }

  getItems() {
  	var thisobj = this;

  	$.getJSON("/api/items.json", function(data) {
      console.log(data);
  		thisobj.setState({
        items: data.results,
        pageCount: Math.ceil(data.num_pages),// data.paginator.num_pages
      });
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
    this.filterItems(text, this.state.tagsSelected, this.state.excludeTagsSelected);
  }

  handleTagSelection(tagsSelected) {
    console.log("tag: " + tagsSelected);
    this.setState({tagsSelected: tagsSelected});
    this.filterItems(this.state.searchText, tagsSelected, this.state.excludeTagsSelected);
  }

  handleExcludeTagSelection(excludeTagsSelected) {
    console.log("ex tag: " + excludeTagsSelected);
    this.setState({excludeTagsSelected: excludeTagsSelected});
    this.filterItems(this.state.searchText, this.state.tagsSelected, excludeTagsSelected);
  }

  filterItems(search, tags, excludeTags) {
    var url = "/api/items.json";//+ "?search=" + search + "&tags=" + tags;
    console.log(url)
    var params = {
      search: search,
      tags: tags,
      excludeTags: excludeTags,
      page: this.state.page,
      itemsPerPage: 2
    }

    var thisobj = this;
    $.getJSON(url, params, function(data) {
      thisobj.setState({
        items: data.results, 
        pageCount: Math.ceil(data.num_pages),
      });
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
    let offset = Math.ceil(selected * this.perPage);
    let page = data.selected + 1;

    this.setState({page: page}, () => {
      this.filterItems(this.state.searchText, this.state.tagsSelected, this.state.excludeTagsSelected);
    });
  }

  render() {
    return (
      <div>
        <InventoryGridHeader searchHandler={this.handleSearch} tagHandler={this.handleTagSelection} tagsSelected={this.state.tagsSelected} excludeTagHandler={this.handleExcludeTagSelection} excludeTagsSelected={this.state.excludeTagsSelected}/>
      	<InventoryGrid items={this.state.items} user={this.state.user}></InventoryGrid>
         <ReactPaginate previousLabel={"previous"}
                       nextLabel={"next"}
                       breakLabel={<a href="">...</a>}
                       breakClassName={"break-me"}
                       pageCount={this.state.pageCount}
                       marginPagesDisplayed={2}
                       pageRangeDisplayed={5}
                       onPageChange={this.handlePageClick}
                       containerClassName={"pagination"}
                       subContainerClassName={"pages pagination"}
                       activeClassName={"active"} />
      </div>
    );
  }
}


export default GridContainer
