import React from 'react'
import { Grid, Row, Col, Form, Panel, FormGroup, FormControl, ControlLabel, Button } from 'react-bootstrap'

const ItemCreationForm = React.createClass({

  getInitialState() {
    return {
      name: "",
      quantity: 0,
      model_no: "",
      description: "",
      custom_fields: {}
    }
  },

  getCustomFieldForm(field, i) {
    return null
  },

  createItem() {

  },

  onChange(e) {
    e.preventDefault()
    this.setState({
      [e.target.name]: e.target.value
    })
  },


  render() {
    return (
      <Grid fluid>
      <Col xs={8} xsOffset={1}>
      <Form>
        <FormGroup bsSize="small" controlId="formHorizontalName">
          <Col componentClass={ControlLabel} sm={2}>
            Name
          </Col>
          <Col sm={10}>
            <FormControl type="text" value={this.state.name} name="name" onChange={this.onChange} />
          </Col>
        </FormGroup>

        <FormGroup bsSize="small" controlId="formHorizontalModelNo">
          <Col componentClass={ControlLabel} sm={2}>
            Model No.
          </Col>
          <Col sm={10}>
            <FormControl type="text" value={this.state.model_no} name="model_no" onChange={this.onChange}/>
          </Col>
        </FormGroup>

        <FormGroup bsSize="small" controlId="formHorizontalDescription">
          <Col componentClass={ControlLabel} sm={2}>
            Description
          </Col>
          <Col sm={10}>
            <FormControl type="text" componentClass="textarea" value={this.state.description} name="description" onChange={this.onChange}/>
          </Col>
        </FormGroup>

        <FormGroup bsSize="small" controlId="formHorizontalQuantity">
          <Col componentClass={ControlLabel} sm={2}>
            Quantity
          </Col>
          <Col sm={2}>
            <FormControl type="number" value={this.state.quantity} name="quantity" onChange={this.onChange}/>
          </Col>
        </FormGroup>

        <hr />

        {this.state.custom_fields.map( (field, i) => {
          return this.getCustomFieldForm(field, i)
        })}

        <FormGroup>
          <Col smOffset={2} sm={10}>
            <Button type="button" onClick={e => console.log(this.state)}>
              Submit
            </Button>
          </Col>
        </FormGroup>
      </Form>
      </Col>
      </Grid>
    )
  }
})

export default ItemCreationForm
