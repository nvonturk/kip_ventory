import React, {Component} from 'react'
import { Row, Col, Form, FormGroup, FormControl, ControlLabel, Glyphicon } from 'react-bootstrap'
import { getCookie } from '../../../csrf/DjangoCSRFToken'
import $ from 'jquery'

class SubjectTag extends Component {
	constructor(props) {
		super(props);

		this.state = {
			editMode: false,
			subjectTag: ""
		}

		this.handleSubjectTagChange = this.handleSubjectTagChange.bind(this);
		this.handleSubjectTagSave = this.handleSubjectTagSave.bind(this);
		this.toggleEditMode = this.toggleEditMode.bind(this);

		this.getSubjectTag();
	}

	getSubjectTag() {
		var _this = this;
    $.ajax({
      url:"/api/subjecttag/",
      type: "GET",
      contentType:"application/json",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(data){
        _this.setState({
          subjectTag: data.text
        })
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
        //todo show error message
        console.log("error");
      }
    });
	}

	saveSubjectTag() {
    $.ajax({
      url:"/api/subjecttag/",
      type: "PUT",
      data: JSON.stringify({
      	text: this.state.subjectTag
      }),
      contentType:"application/json",
      beforeSend: function(request) {
        request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
      },
      success:function(data){
        
      },
      complete:function(){

      },
      error:function (xhr, textStatus, thrownError){
       
      }
    });
	}

	handleSubjectTagChange(e) {
		e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
	}

	handleSubjectTagSave() {
		this.saveSubjectTag();
		this.toggleEditMode();
	}

	toggleEditMode() {
		console.log("hey");
		this.setState((prevState, props) => ({
			editMode: !prevState.editMode,
		}));
	}

	render() {
		if(this.state.editMode) {
			return (
				<Form horizontal>
					<FormGroup bsSize="small">
	          <Col componentClass={ControlLabel} sm={2}>
	            Subject Tag
	          </Col>
	          <Col sm={8} >
	            <FormControl
	              type="text"
	              name="subjectTag"
	              value={this.state.subjectTag}
	              onChange={this.handleSubjectTagChange}
	            />
	          </Col>
	          <Col sm={2}>
	          	<Glyphicon glyph="check" onClick={this.handleSubjectTagSave}/>
	          </Col>
	        </FormGroup>
				</Form>
			)
		} else {
			return (
				<div>
					<p>Subject Tag: 
						<span className="subject-tag"> {this.state.subjectTag}</span>
						<span className="clickable">
	            <Glyphicon glyph="pencil" onClick={this.toggleEditMode}/>
	          </span>
          </p>
				</div>
			)
		}
	}
}

export default SubjectTag