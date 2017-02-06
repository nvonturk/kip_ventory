import React from 'react'
import GridContainer from './gridcontainer'

const Home = React.createClass({
  render() {
    return (
    <div>
    	<GridContainer user={this.props.route.user}/>
	</div>
	)
  }
})

export default Home
