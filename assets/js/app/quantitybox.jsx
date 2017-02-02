import React, { Component } from 'react'

class QuantityBox extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange() {
    this.props.onUserInput(
      this.quantityInput.value,
    );
  }

  render() {
    return (
      <form>
        <input
          type="text"
          placeholder="0"
          ref={(input) => this.quantityInput = input}
          onChange={this.handleChange}
        />
      </form>
    );
  }
}

export default QuantityBox
