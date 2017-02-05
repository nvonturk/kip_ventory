import React from 'react'
import SearchBar from './searchbar'
import { Button, Grid, Row, Col } from 'react-bootstrap'
import SimpleRow from './simplerow'
import TagMultiSelect from './tagmultiselect'

function InventoryGridHeader(props) {
	var columnContents = [
		<SearchBar onUserInput={props.searchHandler}/>,
		<h1> Inventory </h1>,
		<TagMultiSelect className="tag-multi-select" tagsSelected={props.tagsSelected} tagHandler={props.tagHandler}/>,
		<TagMultiSelect className="tag-multi-select" tagsSelected={props.excludeTagsSelected} tagHandler={props.excludeTagHandler}/>

	];

	return (
		<Grid>
		    <Row className="show-grid">
		      <Col xs="3">{columnContents[0]}</Col>
		      <Col xs="5">{columnContents[1]}</Col>
		      <Col xs="2">{columnContents[2]}</Col>
		      <Col xs="2">{columnContents[3]}</Col>

		    </Row>
    	</Grid>
	)
}

export default InventoryGridHeader
