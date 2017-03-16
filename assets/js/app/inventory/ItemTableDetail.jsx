import React from 'react'
import { Grid, Row, Col, Label, Button, Image, Panel, FormGroup, FormControl, Well} from 'react-bootstrap'
import { browserHistory } from 'react-router'

const ItemTableDetail = React.createClass({
  getInitialState() {
    return {
      quantity: 1,
    }
  },


  render() {
    return (
      <Row >
        <Col sm={12}>
          <div style={{margin:"auto"}} className="clickable" onClick={e => {browserHistory.push("/app/inventory/" + this.props.item.name + "/")}} >
            <h5 style={{color: "#df691a"}}>{this.props.item.name}</h5>
            <p>{this.props.item.description}</p>
          </div>
        </Col>
      </Row>
    )
  }
});

export default ItemTableDetail
