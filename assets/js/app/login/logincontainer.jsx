import React from 'react'
import LoginForm from './loginform'

import "whatwg-fetch"

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
    fetch('/api/auth/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
      })
    }).then(function(response) {
        return response.json();
    }).then(function(j) {
        if (j.token != "Failure") {
          localStorage.setItem('token', j.token)
        }
    })
  }
})
