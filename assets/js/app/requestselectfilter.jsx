import React, { Component } from 'react'
import { SplitButton, MenuItem } from 'react-bootstrap'
import SimpleDropdown from './simpledropdown'



function RequestSelectFilter(props){
  return(
    <div>

      <SimpleDropdown title="Status" items={[{name: "name1"}, {name: "name2"}]} callback={changeFilter(props)}/>

      <select id="userRequestSelect" defaultValue="all" onChange={changeFilter(props)}>
        <option value="all">All</option>
        <option value="outstanding">Outstanding</option>
        <option value="approved">Approved</option>
        <option value="denied">Denied</option>s
      </select>
    </div>
  )
}

function changeFilter(props){
  // console.log("later");
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
