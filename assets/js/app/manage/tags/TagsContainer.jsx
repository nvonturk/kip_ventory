import React from 'react'
import { Grid, Row, Col, Nav, NavItem } from 'react-bootstrap'
import $ from "jquery"
import { getJSON, ajax } from 'jquery'
import { getCookie } from '../csrf/DjangoCSRFToken'

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

    this.getAllTags();
  }

  getAllTags(){
    

  }

  createTag(tag){

  }

  deleteTag(tag){

  }

  updateTagList(tags){
    this.setState({tags: tags});
  }



}


export default TagsContainer
