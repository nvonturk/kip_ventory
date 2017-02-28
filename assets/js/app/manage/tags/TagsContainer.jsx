import React, { Component } from 'react'
import { Grid, Button, Col, ListGroup, ListGroupItem } from 'react-bootstrap'
import $ from "jquery"
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class TagsContainer extends Component{
  constructor(props) {
    super(props);
    this.state = {
      tags: [],
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

  createTag(event, tag){
    event.preventDefault();

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
        Hello World
          {tagList}
        </ListGroup>
      </div>
    );
  }



}


export default TagsContainer
