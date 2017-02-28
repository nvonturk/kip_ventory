import React, { Component } from 'react'
import { Grid, Button, Col, ListGroup, ListGroupItem, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'
import $ from "jquery"
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class TagsContainer extends Component{
  constructor(props) {
    super(props);
    this.state = {
      tags: [],
      name: "",
    }

    this.getAllTags = this.getAllTags.bind(this);
    this.createTag = this.createTag.bind(this);
    this.deleteTag = this.deleteTag.bind(this);
    this.updateTagList = this.updateTagList.bind(this);
    this.getTagList = this.getTagList.bind(this);

    this.getAllTags();
  }

  getAllTags(){
      var url = "/api/tags/?all=true"
      var _this = this
      getJSON(url, function(data) {
        _this.setState({
          tags: data,
        });
      })


  }

  handleChange(name, e) {
    var change = {};
    change[name] = e.target.value;
    this.setState(change);
  }

  createTag(event){
    event.preventDefault();
    var _this = this

    if(this.state.name == ""){
      //TODO show error here
      console.log("Can't create blank tag")
    } else{
      $.ajax({
        url:"/api/tags/",
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
        },
        data: {
          name: this.state.name,
        },
        traditional: true,
        success:function(response){
          _this.getAllTags();
        },
        complete:function(){

        },
        error:function (xhr, textStatus, thrownError){
          console.log(xhr)
          console.log(textStatus)
          console.log(thrownError)
          alert("error doing something");
        }
      });
    }

  }

  deleteTag(event, tag){
    event.preventDefault();

    var _this = this
    $.ajax({
      url:"/api/tags/?name="+tag.name,
      type: "DELETE",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(response){
        _this.getAllTags();
      },
      complete:function(){
          },
      error:function (xhr, textStatus, thrownError){
          alert("error doing something");

      }
    });
  }

  updateTagList(tags){
    this.setState({tags: tags});
  }

  getTagList(){
    var html = [];

    html.push(this.state.tags.map( (tag, i) => {
      return (<ListGroupItem>{tag.name} <Button bsStyle="danger" onClick={e => {this.deleteTag(e, tag)}}>Delete</Button></ListGroupItem>);
    }));

    return html;
  }


  render(){
    var tagList = this.getTagList();
    return (
      <div>
        <ListGroup>
          {tagList}
        </ListGroup>
        <FormGroup controlId="newTagForm">
          <ControlLabel>New Tag:</ControlLabel>
          <FormControl
            type="text"
            name="name"
            value={this.state.name ? this.state.name : ""}
            placeholder={this.state.name}
            onChange={this.handleChange.bind(this, 'name')}
          ></FormControl>
          <Button onClick={e =>{this.createTag(e)}}>Create Tag</Button>
        </FormGroup>
      </div>
    );
  }



}


export default TagsContainer
