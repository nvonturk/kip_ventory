import React, { Component, PropTypes } from 'react';

class Checkbox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: props.startChecked,
    }

    this.toggleCheckboxChange = this.toggleCheckboxChange.bind(this);
  }
 
  toggleCheckboxChange () {
    const { handleCheckboxChange, label} = this.props;

    this.setState((prevState, props) => {
      return {isChecked: !prevState.isChecked};
    }, () => handleCheckboxChange(this.state.isChecked, label));

  }

  render() {
  
    return (
      <div className="checkbox">
        <label>
          <input
            type="checkbox"
            value={this.props.label}
            checked={this.state.isChecked}
            onChange={this.toggleCheckboxChange}
          />
          {this.props.label}
        </label>
      </div>
    );
  }
}

Checkbox.propTypes = {
  label: PropTypes.string.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
};

export default Checkbox