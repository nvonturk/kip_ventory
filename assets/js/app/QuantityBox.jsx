import React, { Component } from 'react'

class QuantityBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      placeholder: "0"
    }
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
          placeholder={this.state.placeholder}
          ref={(input) => this.quantityInput = input}
          onChange={this.handleChange}
        />
      </form>
    );
  }
}

export default QuantityBox
