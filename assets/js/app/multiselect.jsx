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
      value: [],
    };
    this.handleSelectChange = this.handleSelectChange.bind(this);

  }

  handleSelectChange (value) {
    console.log('You\'ve selected:', value);
    //this.setState({ value });
    
    this.setState({
      value: value,
    
    });

  }

  render () {
    return (
      <div>
        <Select multi simpleValue value={this.state.value} placeholder={this.props.placeholder} options={this.props.options} onChange={this.handleSelectChange.bind(this)} />
      </div>
    );
  }
}


export default MultiSelect
