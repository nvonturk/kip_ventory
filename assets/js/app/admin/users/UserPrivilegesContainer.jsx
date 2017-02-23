import React, { Component } from 'react'
import { Table } from 'react-bootstrap'
import $ from 'jquery'

class UserPrivilegesContainer extends Component {
	constructor(props) {
	    super(props); 
	    this.state = {
	      users:[],
	    };

	    this.getTableRow = this.getTableRow.bind(this);
	    this.getUsers();

	}	

	getUsers() {
		var thisobj = this;
		$.getJSON('/api/users/', function(data) {
							console.log(data);
			thisobj.setState({
				users: data //.results
			});
		})
	}

	getPrivilege(is_superuser, is_staff) {
		if (is_superuser) return "Admin";
		else if (is_staff) return "Manager";
		else return "User";
	}


	// todo change i to actual i (pagination)
	getTableRow(user, i) {
		console.log(user);
	    return (
	      <tr key={user.username}>
	      	<td>{i}</td>
	        <td>{user.username}</td>
	        <td>{user.first_name}</td>
	        <td>{user.last_name}</td>
	        <td>{user.email}</td>
	        <td>{this.getPrivilege(user.is_superuser, user.is_staff)}</td>
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
			<Table striped bordered condensed hover>
	          	{this.getTableHeader()}
	          	<tbody>
 					{this.state.users.map((user, i) => this.getTableRow(user, i))}	          
 				</tbody>
	        </Table>
		)
	}
}	

export default UserPrivilegesContainer