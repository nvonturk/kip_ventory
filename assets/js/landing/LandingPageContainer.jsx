import React from 'react'


const LandingPageContainer = React.createClass({
  getInitialState() {
    return {}
  },

  render() {
    return (
      <div>
        {this.props.children}
      </div>
    )
  }
});

export default LandingPageContainer
