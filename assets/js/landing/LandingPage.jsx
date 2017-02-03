import React from 'react'
import { Link } from 'react-router'
import { Jumbotron, Well } from 'react-bootstrap'

var LandingPage = React.createClass({
  getInitialState() {
    return {}
  },

  render() {
    return (
      <div>
        <Jumbotron>
          <h1>kip-ventory</h1>
          <p>Your one-stop-shop for any hardware-related needs!</p>
          <Well><Link to="/login/">Login</Link></Well>
        </Jumbotron>
      </div>
    );
  }
});


export default LandingPage;
