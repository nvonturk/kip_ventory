import React from 'react'
import { Grid, Row, Col, Label, Button, Image, Panel, FormGroup, FormControl} from 'react-bootstrap'
import { browserHistory } from 'react-router'

const ItemTableDetail = React.createClass({
  getInitialState() {
    return {
      quantity: 1,
      in_cart: this.props.item.in_cart
    }
  },

  getCustomFieldView(field, i) {
    return (
      <div key={i}>
        <p><span>{field.name}: </span><span>{field.value}</span></p>
      </div>
    )
  },

  render() {
    return (
      <Row>
        <Col sm={12}>
          <div style={{margin:"auto"}} className="clickable" onClick={() => browserHistory.push("/app/items/" + this.props.item.name + "/")}>
            <Row>
              <Col sm={8}>
                <h5>{this.props.item.name}</h5>
                <p>{this.props.item.description}</p>
              </Col>
              <Col sm={4} style={{maxHeight: '75px', overflow: 'auto'}}>
                {this.props.item.custom_fields.map( (field, i) => {
                  return field.field_type !== "m" ? this.getCustomFieldView(field, i) : null
                })}
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    )
  }
});

export default ItemTableDetail
