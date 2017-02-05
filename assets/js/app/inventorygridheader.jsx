import React from 'react'
import SearchBar from './searchbar'
import { Button, Grid, Row, Col } from 'react-bootstrap'
import SimpleRow from './simplerow'
import TagMultiSelect from './tagmultiselect'

function InventoryGridHeader(props) {
	var columnContents = [
		<SearchBar className="search-bar absolute-bottom absolute-row" onUserInput={props.searchHandler}/>,
		<h1 className="title-text absolute-bottom absolute-row"> Inventory </h1>,
		<TagMultiSelect className="tag-multi-select absolute-bottom absolute-row" tagsSelected={props.tagsSelected} tagHandler={props.tagHandler}/>,
		<TagMultiSelect className="tag-multi-select absolute-bottom absolute-row" tagsSelected={props.excludeTagsSelected} tagHandler={props.excludeTagHandler}/>

	];

	return (
		<Grid className="search-tag-container">
		    <Row className="show-grid relative-container">
		      <Col xs="3" className="relative-container">{columnContents[0]}</Col>
		      <Col xs="5" className="relative-container">{columnContents[1]}</Col>
		      <Col xs="2" className="relative-container">{columnContents[2]}</Col>
		      <Col xs="2" className="relative-container">{columnContents[3]}</Col>
		    </Row>
    	</Grid>
	)
}

export default InventoryGridHeader
