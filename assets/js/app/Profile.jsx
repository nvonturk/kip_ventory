import React from 'react'
import $ from 'jquery'
import GenerateAPITokenContainer from './apitoken/GenerateAPITokenContainer'

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

  getSubscribedDiv(user) {
    if (user.is_staff){
      var subscribed = user.profile.subscribed ? "Yes" : "No";
      return <p>Email Subscription: {subscribed}</p> 
    }
    return "";
  }

  render() {
  	var element = "";
  	if(this.user) {
  		element = (
  			<div>
  			<p>First name: {this.user.first_name}</p>
    		<p>Last name: {this.user.last_name}</p>
    		<p>Email: {this.user.email}</p>
    		<p>Privilege: {this.getPrivilegeValue(this.user)}</p>
        {this.getSubscribedDiv(this.user)} 
    		</div>
    	);
  	}
    return (
    	<div>
    		{element}
        <GenerateAPITokenContainer/>
    	</div>
    )
  }
}

export default Profile
