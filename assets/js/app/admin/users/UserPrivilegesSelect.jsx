import React, { Component } from 'react'
import { Table, Button, Glyphicon} from 'react-bootstrap'
import Select from 'react-select'
import $ from 'jquery'

class UserPrivilegesSelect extends Component {
	constructor(props) {
	    super(props);
	    this.state = {
	      user: this.props.user,
	      editMode: false,
	    };

	    this.privilegeOptions = [
	    	 { value: 'Admin', label: 'Admin' },
         { value: 'Manager', label: 'Manager' },
         { value: 'User', label: 'User' },
	    ];

	    this.handleEditButtonClicked = this.handleEditButtonClicked.bind(this);
	    this.changePrivilege = this.changePrivilege.bind(this);

	}

	getEditOrSaveButton() {
		if(this.state.editMode) {
			return (
				<span className="clickable"><Glyphicon glyph="check" onClick={this.handleEditButtonClicked}/></span>
			)
		} else {
			return (
				<span className="clickable"><Glyphicon glyph="pencil" onClick={this.handleEditButtonClicked}/></span>
			)
		}
	}

	handleEditButtonClicked() {
		this.setState(function(prevState, props) {
			return {
				editMode: !prevState.editMode
			}
		})
	}

	getPrivilege(is_superuser, is_staff) {
		return this.state.editMode ? this.getPrivilegeEditMode(is_superuser, is_staff) : this.getPrivilegeNormalMode(is_superuser, is_staff);

	}

	getPrivilegeValue(is_superuser, is_staff) {
		if (is_superuser) return "Admin";
		else if (is_staff) return "Manager";
		else return "User";
	}

	getPrivilegeNormalMode(is_superuser, is_staff) {
		return this.getPrivilegeValue(is_superuser, is_staff);
	}

	changePrivilege(value) {
		this.props.changePrivilegeHandler(this.state.user, value);
	}

	getPrivilegeEditMode(is_superuser, is_staff) {
		var value = this.getPrivilegeValue(is_superuser, is_staff);
    return (
     	<Select user={this.state.user} value={value} options={this.privilegeOptions} onChange={this.changePrivilege} clearable={false}/>
    )
	}


	render() {
		var privilegeDiv = this.getPrivilege(this.state.user.is_superuser, this.state.user.is_staff);
		return (
			<div>
			<div style={{width:"80px", display:"inline-block"}}>
				{privilegeDiv}
			</div>
			{this.getEditOrSaveButton()}
			</div>
		)
	}
}

export default UserPrivilegesSelect
