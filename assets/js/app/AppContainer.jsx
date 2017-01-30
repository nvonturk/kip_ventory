import React from 'react'

const AppContainer = React.createClass({
  render() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
})

export default AppContainer;
