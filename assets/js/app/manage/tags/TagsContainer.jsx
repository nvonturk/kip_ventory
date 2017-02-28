import React, { Component } from 'react'
import { Form, Grid, Row, Button, Col, ListGroup, ListGroupItem, FormGroup, FormControl, ControlLabel } from 'react-bootstrap'
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
      return (<ListGroupItem><Row><Col xs={10}>{tag.name} </Col><Col xs={2}><Button bsStyle="danger" onClick={e => {this.deleteTag(e, tag)}}>Delete</Button></Col></Row></ListGroupItem>);
    }));

    return html;
  }

  // <ControlLabel>New Tag:</ControlLabel>

  render(){
    var tagList = this.getTagList();
    var finalList = (<ListGroup>{tagList}</ListGroup>);
    return (
        <Grid fluid>
          <Row>
            <Col xs={12} >
              <h3>Tag Manager</h3>
              <hr />
              <p>
                Create and delete tags in the system.
              </p>
              <br />
            </Col>
          </Row>
          <Row>
            <Col xs={12} style={{maxHeight: '500px', overflow: 'auto'}}>
              {finalList}
            </Col>
          </Row>
          <Row>
            <Form horizontal>
              <FormGroup controlId="newTagForm">
                <Col componentClass={ControlLabel} sm={2}>
                  New Tag:
                </Col>
                <Col sm={6}>
                  <FormControl
                    type="text"
                    name="name"
                    value={this.state.name ? this.state.name : ""}
                    placeholder={this.state.name}
                    onChange={this.handleChange.bind(this, 'name')}
                  ></FormControl>
                </Col>
                <Col sm={3}>
                  <Button onClick={e =>{this.createTag(e)}}>Create Tag</Button>
                </Col>
              </FormGroup>
            </Form>
          </Row>
        </Grid>
    );
  }



}


export default TagsContainer
