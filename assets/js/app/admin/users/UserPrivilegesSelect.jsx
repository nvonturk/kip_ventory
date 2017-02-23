import React, { Component } from 'react'
import { Table, Button } from 'react-bootstrap'
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

	getEditButtonName() {
		return this.state.editMode ? "Done" : "Edit";
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
		//console.log(this.props);
		this.props.changePrivilegeHandler(this.state.user, value);
	}

	getPrivilegeEditMode(is_superuser, is_staff) {
		var value = this.getPrivilegeValue(is_superuser, is_staff);
        return (
        	<div>
         	<Select user={this.state.user} value={value} options={this.privilegeOptions} onChange={this.changePrivilege} clearable={false}/>
         	</div>
        )
	}


	render() {
		var privilegeDiv = this.getPrivilege(this.state.user.is_superuser, this.state.user.is_staff);
		return (
			<div>
			<Button onClick={this.handleEditButtonClicked}>{this.getEditButtonName()}</Button>
			{privilegeDiv}
			</div>
		)
	}
}	

export default UserPrivilegesSelect