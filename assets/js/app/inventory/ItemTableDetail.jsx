import React from 'react'
import { Grid, Row, Col, Label, Button, Image, Panel, FormGroup, FormControl} from 'react-bootstrap'
import { browserHistory } from 'react-router'

const ItemTableDetail = React.createClass({
  getInitialState() {
    return {
      quantity: 1,
    }
  },


  render() {
    return (
      <Row>
        <Col sm={12}>
          <div style={{margin:"auto"}} >
            <Row>
              <Col sm={8}>
                <h5><a style={{color: "#df691a", textDecoration:"none"}} href={"/app/items/" + this.props.item.name + "/"}>{this.props.item.name}</a></h5>
                <p>{this.props.item.description}</p>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    )
  }
});

export default ItemTableDetail
