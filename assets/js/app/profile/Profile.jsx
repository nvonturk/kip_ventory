import React from 'react'
import $ from 'jquery'
import {Table, Grid, Row, Col} from 'react-bootstrap'
import GenerateAPITokenContainer from '../apitoken/GenerateAPITokenContainer'
import EmailSubscriptionContainer from './EmailSubscriptionContainer'

class Profile extends React.Component {

  constructor(props) {
  	super(props);
  	this.user = this.props.route.user;
  }

  getPrivilegeValue(user) {
    if (user.is_superuser) return "Admin";
    else if (user.is_staff) return "Manager";
    else return "User";
  }

  // todo change i to actual i (pagination)
  getTableRow(user) {
      return (
        <tr key={user.username}>
          <td>{user.username}</td>
          <td>{user.first_name}</td>
          <td>{user.last_name}</td>
          <td>{user.email}</td>
          <td>{this.getPrivilegeValue(this.user)}</td>

        </tr>
      )
   }

   getTableHeader() {
      return (
        <thead>
          <tr>
            <th>Username</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Email</th>
            <th>Privilege</th>
          </tr>
        </thead>
      )
   }

  getProfileTable() {
    var element = "";
    if(this.user) {
      element = (
        <div>
          <h3> Personal Information </h3>
          <hr></hr>
          <Table condensed hover>
            {this.getTableHeader()}
            <tbody>
                {this.getTableRow(this.user)}            
            </tbody>
          </Table>
        </div>
      );
    }
    return element;
  }

  render() {
    var emailSubscriptionRow = "";
    if(this.user.is_staff) {
      emailSubscriptionRow = (
        <Row>
          <Col sm={12}>
            <EmailSubscriptionContainer user={this.user} />
          </Col>
        </Row>
      );
    }
  	
    return (
    	<Grid>
        <Row>
          <Col sm={12}>
    		    {this.getProfileTable()}
          </Col>
        </Row>
        {emailSubscriptionRow}
        <GenerateAPITokenContainer/>
    	</Grid>
    )
  }
}

export default Profile
