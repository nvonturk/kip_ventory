import React, { Component } from 'react'
import { SplitButton, MenuItem } from 'react-bootstrap'



function RequestSelectFilter(props){
  return(
    <div>
      <select>
        <option>All</option>
        <option>Outstanding</option>
        <option>Approved</option>
        <option>Denied</option>s
      </select>
    </div>
  )
}


// class RequestSelectFilter extends Component{
//   render() {
//     // var numOptions = this.props.types.length;
//     var dropdownOptions = [];
//     this.props.types.forEach(function(type, i){
//       // dropdownOptions.push(<MenuItem key={i}>{type}</MenuItem>)
//       dropdownOptions.push(<option key={i} value={type} on>{type}</option>)
//     // for(var i = 0 ; i < numOptions ; i ++){
//       // dropdownOptions.push(<MenuItem>{props.types[i]}</MenuItem>)
//     // }
//     });
//
//     return (
//       // <SplitButton bsStyle="default" title="Filter Requests" id="user-requests-dropdown">
//       //   {dropdownOptions}
//       // </SplitButton>
//       // <select onchange={this.props.selectHandler(this.options[this.selectedIndex.value])}>
//       <select>
//         {dropdownOptions}
//       </select>
//     );
//   }
//
//
//
// }

// function RequestSelectFilter(props){
//   var numOptions = props.types.length;
//   var dropdownOptions = [];
//   // props.types.forEach(function(type){
//   for(var i = 0 ; i < numOptions ; i ++){
//     dropdownOptions.push(<MenuItem>{props.types[i]}</MenuItem>)
//   }
//   // });
//
//   return (
//     <SplitButton bsStyle="default" title="Filter Requests" id="user-requests-dropdown">
//       {dropdownOptions}
//     </SplitButton>
//   )
//
//
// }


export default RequestSelectFilter
