import React from 'react'
import SearchBar from './searchbar'
import { Button } from 'react-bootstrap'
import SimpleRow from './simplerow'
import TagMultiSelect from './tagmultiselect'

function InventoryGridHeader(props) {
	var columnContents = [
		<Button onClick={props.getAllItemsCallback}>Get all items</Button>,
		<SearchBar onUserInput={props.searchHandler}/>,
		<TagMultiSelect callback={props.tagHandler}/>
	];

	return (
		<div>
	      	<SimpleRow columnContents={columnContents}/>
      	</div>
	)
}

export default InventoryGridHeader