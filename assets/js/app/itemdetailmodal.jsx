import React, { Component } from 'react'
import { Button, Modal }  from 'react-bootstrap'
import QuantityBox from './quantitybox'

class ItemDetailModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      quantity:0,
    	showModal: false
    };
    this.close = this.close.bind(this);
    this.open = this.open.bind(this);
    this.addToCart = this.addToCart.bind(this);
    this.setQuantity = this.setQuantity.bind(this);
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  addToCart() {
    this.setState({ showModal: false});
  }

  setQuantity(value){
    this.setState({quantity:value});
  }

  render() {
    return (
      <div>
        <Button
          bsStyle="primary"
          bsSize="large"
          onClick={this.open}
        >
          {this.props.item.name}
        </Button>

        <Modal show={this.state.showModal} onHide={this.close}>
          <Modal.Header closeButton>
            <Modal.Title>{this.props.item.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Name: {this.props.item.name}</p>
            <p>Model No: {this.props.item.model}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.addToCart}>Add to Cart</Button>
            <QuantityBox onUserInput={this.setQuantity}/>
            <Button onClick={this.close}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
export default ItemDetailModal
