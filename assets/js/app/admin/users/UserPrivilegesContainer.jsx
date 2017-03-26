import React, { Component } from 'react'
import { Table, Button } from 'react-bootstrap'
import Select from 'react-select'
import $ from 'jquery'
import UserPrivilegesSelect from './UserPrivilegesSelect'
import { getCookie } from '../../../csrf/DjangoCSRFToken'

class UserPrivilegesContainer extends Component {
	constructor(props) {
	    super(props); 
	    this.state = {
	      users:[],
	      editMode: false,
	    };

	    this.privilegeOptions = [
	    	 	{ value: 'Admin', label: 'Admin' },
                { value: 'Manager', label: 'Manager' },
                { value: 'User', label: 'User' },
	    ];

	    this.getTableRow = this.getTableRow.bind(this);
	    this.handleEditButtonClicked = this.handleEditButtonClicked.bind(this);
	    this.changePrivilegeHandler = this.changePrivilegeHandler.bind(this);
	    this.getUsers();

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

	getUsers() {
		var thisobj = this;
		$.getJSON('/api/users/', function(data) {
			thisobj.setState({
				users: data //.results
			});
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
		//console.log(this);
	}

	getPrivilegeEditMode(is_superuser, is_staff) {
		var value = this.getPrivilegeValue(is_superuser, is_staff);
        return <Select value={value} options={this.privilegeOptions} onChange={this.changePrivilege} clearable={false}/>

	}

	changePrivilegeHandler(user, value) {
	
		if(value.value == "Admin") {
			user.is_superuser = true;
			user.is_staff = true;
		} else if (value.value == "Manager") {
			user.is_superuser = false;
			user.is_staff = true;
		} else if (value.value == "User"){
			user.is_superuser = false;
			user.is_staff = false;
		}

		var thisobj = this;
		$.ajax({
		    url:"/api/users/edit/" + user.username + "/",
		    type: "PUT",
		    data: JSON.stringify(user),
		    contentType:"application/json; charset=utf-8",
      		processData: false,
		    beforeSend: function(request) {
		      request.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
		    },
		    success:function(response){
		      thisobj.getUsers();
		    },
		    complete:function(){},
		    error:function (xhr, textStatus, thrownError){
		    	//todo fix bug where if you change yourself to nonadmin, it still updates changes on the frontend evne though it shouldnt
		        alert("error editing user");
		        thisobj.getUsers();
		        console.log(textStatus)
		    }
		});
	}

	getTableRow(user, i) {
	    return (
	      <tr key={user.username}>
	      	<td>{i+1}</td>
	        <td>{user.username}</td>
	        <td>{user.first_name}</td>
	        <td>{user.last_name}</td>
	        <td>{user.email}</td>
	        <td><UserPrivilegesSelect user={user} changePrivilegeHandler={this.changePrivilegeHandler}/></td>

	      </tr>
	    )
	 }

	 getTableHeader() {
	    return (
	      <thead>
	        <tr>
	       	  <th>#</th>
	          <th>Username</th>
	          <th>First Name</th>
	          <th>Last Name</th>
	          <th>Email</th>
	          <th>Privilege</th>
	        </tr>
	      </thead>
	    )
	 }

	render() {
		return (
			<div>
			<Table bordered condensed hover>
	    	{this.getTableHeader()}
	      <tbody>
 					{this.state.users.map((user, i) => this.getTableRow(user, i))}	          
 				</tbody>
	    </Table>
	    </div>
		)
	}
}	

export default UserPrivilegesContainer