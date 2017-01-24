import React, { Component } from 'react'
import { Router, Route, Link, IndexRoute, hashHistory, browserHistory, DefaultRoute } from 'react-router'

class App extends Component {
  render () {
    return (
      <Router history={browserHistory}>
        <Route path='/app' component={Container}>
          <IndexRoute component={Home} />
          <Route path='address' component={Address} />
          <Route path='*' component={NotFound} />
        </Route>
      </Router>
    )
  }
}

const Nav = () => (
  <div>
    <Link to='/'>Home</Link>&nbsp;
    <Link to='/address'>Address</Link>
  </div>
)

const Container = (props) => <div>
  <Nav />
  {props.children}
</div>

const Home = () => <h1 id="main-title">Hello from Home!</h1>
const Address = () => <h1>We are located at 555 Jackson St.</h1>
const NotFound = () => <h1>404.. This page is not found!</h1>

export default App
