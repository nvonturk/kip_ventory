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

  authenticateUser: function(data) {
    console.log(data);
  },


})
