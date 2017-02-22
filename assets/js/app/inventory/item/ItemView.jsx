import React from 'react'
import { Grid, Row, Col, Panel } from 'react-bootstrap'


const ItemView = React.createClass({
  getInitialState() {
    return {}
  },

  render() {
    console.log(this.props.item)
    return (
      <Grid>
        <Row>
          <Col xs={1}>
            <h5>{this.props.item.name}</h5>
          </Col>
          <Col xs={3}>
            {this.props.item.description}
          </Col>
        </Row>
      </Grid>
    )
  }

})

export default ItemView
