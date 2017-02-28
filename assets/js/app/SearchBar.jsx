import React, { Component } from 'react'
import { FormGroup } from 'react-bootstrap'


class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange() {
    this.props.onUserInput(
      this.filterTextInput.value,
    );
  }

  render() {
    return (
      <FormGroup bsSize="small" className={this.props.className}>
        <input style={{fontSize:"12px"}}
          type="text"
          placeholder="Search..."
          value={this.props.filterText}
          ref={(input) => this.filterTextInput = input}
          onChange={this.handleChange}
        />
      </FormGroup>
    );
  }
}

export default SearchBar
