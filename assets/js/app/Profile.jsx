import React from 'react'
import $ from 'jquery'

class Profile extends React.Component {

  constructor(props) {
  	super(props);
  	this.user = this.props.route.user;
  }

  render() {
  	var element = "";
  	if(this.user) {
  		element = (
  			<div>
  			<p>First name: {this.user.first_name}</p>
    		<p>Last name: {this.user.last_name}</p>
    		<p>Email: {this.user.email}</p>
    		<p>Admin? {this.user.is_staff ? "Yes": "No"}</p>
    		</div>
    	);
  	}
    return (
    	<div>
    		{element}
    	</div>
    )
  }
}

export default Profile
