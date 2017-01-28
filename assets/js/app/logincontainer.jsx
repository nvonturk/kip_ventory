import React from 'react'

export default React.createClass({
  render() {
    return (
      <div id="login-container">
        {this.props.children}
      </div>);
  }
})
