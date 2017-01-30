import React, { Component } from 'react'
import { DropdownButton, MenuItem } from 'react-bootstrap'
/*
  Use:
  <SimpleDropdown title={title1} items={[{name: name1}, {name: name2}, etc]} callback={callback1}/>

*/
function SimpleDropdown(props) {
  var menuItems = [];
  for (var i = 0; i < props.items.length; i++) {
    menuItems.push(<MenuItem eventKey={i} onSelect={props.callback}>{props.items[i].name}</MenuItem>);
  }

  return (
	 <DropdownButton title={props.title} key="0" id="simple-dropdown">
      {menuItems}
    </DropdownButton>
  )
}

export default SimpleDropdown