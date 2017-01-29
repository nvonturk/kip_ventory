import React from 'react'
import LoginForm from './loginform'

export default React.createClass({

  render: function() {
    return (
      <div>
        <LoginForm authFunc={this.authenticateUser} />
      </div>
    );
  },

  authenticateUser: function(event) {
    event.preventDefault()
    console.log(event)
    console.log(event.target.email.value)
    console.log(event.target.username.value)
  },


})
