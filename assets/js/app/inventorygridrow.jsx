import React from 'react'
import {Row, Col} from 'react-bootstrap'
import TagMultiSelect from './tagmultiselect'
import ItemDetailModal from './itemdetailmodal'
import SimpleRow from './simplerow'

function InventoryGridRow(props) {
  var columnContents = [];
  var numCols = props.items.length;

  for (var i = 0; i < numCols; i++) {
  	columnContents.push(<ItemDetailModal user={props.user} item={props.items[i]}/>);
  }

  return <SimpleRow width="4" columnContents={columnContents}/>
}

export default InventoryGridRow
