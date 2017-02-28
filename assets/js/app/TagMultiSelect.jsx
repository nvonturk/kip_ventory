import React, { Component } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
import $ from "jquery"
import MultiSelect from './MultiSelect';

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
  	$.getJSON("/api/tags/", function(data) {
  		for(var i = 0; i < data.results.length; i++) {
  			var tag = data.results[i];
  			tag["value"] = tag.name;
  			tag["label"] = tag.name;
  		}
  		thisobj.setTags(data.results);
  	});
  }

  setTags(tags) {
  	this.setState({
  		tags: tags
  	})
  }

  render() {
    return (
      <div className={this.props.className}>
      	<MultiSelect options={this.state.tags} value={this.props.tagsSelected} placeholder={this.props.placeholder} onChange={this.props.tagHandler}/>
      </div>
    );
  }
}

export default TagMultiSelect
