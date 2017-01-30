import React, { Component } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import $ from "jquery"
import MultiSelect from './multiselect';

//use: <TagMultiSelect/>
class TagMultiSelect extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
    	tags: [],
    };
    this.getAllTags = this.getAllTags.bind(this);
    this.setTags = this.setTags.bind(this);
    this.getAllTags();
  }

  getAllTags() {
  	var thisobj = this;
  	$.getJSON("http://localhost:8000/api/tags.json", function(data) {
  		for(var i = 0; i < data.length; i++) {
  			var tag = data[i];
  			tag["value"] = tag.name;
  			tag["label"] = tag.name;
  		}
  		thisobj.setTags(data);
  	});
  }

  setTags(tags) {
  	this.setState({
  		tags: tags
  	})
  }

  render() {
    return (
      <div>
      	<MultiSelect options={this.state.tags} placeholder="Select your favourite(s)"/>
      </div>
    );
  }
}

export default TagMultiSelect
