import React from 'react'
import SearchBar from './searchbar'
import { Button, Grid, Row, Col } from 'react-bootstrap'
import SimpleRow from './simplerow'
import TagMultiSelect from './tagmultiselect'

function InventoryGridHeader(props) {
	var columnContents = [
		<SearchBar onUserInput={props.searchHandler}/>,
		<h1> Inventory </h1>,
		<TagMultiSelect className="tag-multi-select" tagsSelected={props.tagsSelected} tagHandler={props.tagHandler}/>
	];

	return (
		<Grid>
		    <Row className="show-grid">
		      <Col xs="3">{columnContents[0]}</Col>
		      <Col xs="6">{columnContents[1]}</Col>
		      <Col xs="3">{columnContents[2]}</Col>
		    </Row>
    	</Grid>
	)
}

export default InventoryGridHeader
