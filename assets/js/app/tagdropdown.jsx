import React, { Component } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import $ from "jquery"
import SimpleDropdown from './simpledropdown'

// use: <TagDropdown/>
class TagDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = {
    	tags: [],
    	tag: {name: "Tags"},
    };
    this.getAllTags = this.getAllTags.bind(this);
    this.setTags = this.setTags.bind(this);
   	this.handleTagChange = this.handleTagChange.bind(this);
    this.getAllTags();
  }

  getAllTags() {
  	var thisobj = this;
  	$.getJSON("/api/tags.json", function(data) {
  		thisobj.setTags(data);
  	});
  }

  setTags(tags) {
  	this.setState({
  		tags: tags
  	})
  }

  handleTagChange(eventKey, e) {
  	this.setState({
  		tag: this.state.tags[eventKey]
  	})
  }

  render() {
    return (
      <div>
        <SimpleDropdown title={this.state.tag.name} items={this.state.tags} callback={this.handleTagChange}/>
      </div>
    );
  }
}

export default TagDropdown
