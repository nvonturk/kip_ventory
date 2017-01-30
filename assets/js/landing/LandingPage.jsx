import React from 'react'
import { Jumbotron } from 'react-bootstrap'

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
        </Jumbotron>
      </div>
    );
  }
});


export default LandingPage;
