import React from 'react'
import GridContainer from './GridContainer'

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
