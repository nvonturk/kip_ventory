import React, { Component } from 'react'
import { SplitButton, MenuItem } from 'react-bootstrap'
import SimpleDropdown from './simpledropdown'
import Select from 'react-select';


class RequestSelectFilter extends Component{
    constructor(props) {
      super(props);
      this.state = {
        value: props.value,
      };
    }

    render(){
      return (
        <div>
          <Select value={this.props.value} placeholder={this.props.placeholder} options={this.props.options} onChange={this.props.onChange} />
        </div>
      )
    }

}

export default RequestSelectFilter
