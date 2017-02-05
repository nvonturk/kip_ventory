import React from 'react'
import {Grid} from 'react-bootstrap'
import InventoryGridRow from './inventorygridrow'

const NUM_ROWS = 3;

function InventoryGrid(props) {
  var rows = [];
  var numRows = props.items.length / NUM_ROWS;

  for (var i = 0; i < numRows; i++) {
    var rowItems = props.items.slice(i*NUM_ROWS, i*NUM_ROWS + NUM_ROWS);
    rows.push(<InventoryGridRow key={i} items={rowItems} user={props.user}/>);
  }
  
  return <Grid class="inventory-grid">{rows}</Grid>
}

export default InventoryGrid
