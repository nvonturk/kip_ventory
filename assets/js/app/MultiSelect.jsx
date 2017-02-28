import React, { Component } from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css'

/*
  Use:
  <MultiSelect options={{label:label1, value:value1}, {label:label2, value:value2}, etc} placeholder={placeholder}/>
*/
class MultiSelect extends Component {
  constructor(props) {
    super(props);

    this.state = {
      value: props.value,
    };
  }

  handleSelectChange (value) {
    console.log('You\'ve selected:', value);
    this.setState({ value });
    console.log(this.state);
  }

  render () {
    return (
      <div>
        <Select style={{fontSize:"12px"}} multi simpleValue value={this.props.value} placeholder={this.props.placeholder} options={this.props.options} onChange={this.props.onChange} />
      </div>
    );
  }
}


export default MultiSelect
