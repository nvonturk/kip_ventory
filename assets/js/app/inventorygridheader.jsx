import React from 'react'
import SearchBar from './searchbar'
import { Button, Grid, Row, Col } from 'react-bootstrap'
import SimpleRow from './simplerow'
import TagMultiSelect from './tagmultiselect'

function InventoryGridHeader(props) {
	var columnContents = [
		<TagMultiSelect className="tag-multi-select absolute-bottom absolute-row" placeholder="Include tags" tagsSelected={props.tagsSelected} tagHandler={props.tagHandler}/>,
		<SearchBar className="search-bar absolute-bottom absolute-row" onUserInput={props.searchHandler}/>,
		<TagMultiSelect className="tag-multi-select absolute-bottom absolute-row" placeholder="Exclude tags" tagsSelected={props.excludeTagsSelected} tagHandler={props.excludeTagHandler}/>
	];

	return (
		<Grid className="search-tag-container">
		    <Row className="show-grid relative-container">
		      <Col xs={4} className="relative-container">{columnContents[0]}</Col>
		      <Col xs={4} className="relative-container">{columnContents[1]}</Col>
		      <Col xs={4} className="relative-container">{columnContents[2]}</Col>
		    </Row>
		    <Row className="show-grid">
		      <Col xs={12}><h1 className="title-text">Inventory</h1></Col>
		    </Row>
    	</Grid>
	)
}

export default InventoryGridHeader
