import React from 'react';
import ReactDOM from 'react-dom';

class Hello extends React.Component {
  render(){
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-2"></div>
          <div className="well col-md-8">
            <h1 id="main-title" className="center">Awesome App</h1>
          </div>
          <div className="col-md-2"></div>
        </div>
      </div>
    )
   }
}

ReactDOM.render( <Hello />, document.getElementById('react-container'))
