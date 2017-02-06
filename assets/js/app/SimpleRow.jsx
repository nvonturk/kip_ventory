import React from 'react'
import { Grid, Row, Col } from 'react-bootstrap'

function SimpleRow(props) {
	var cols = [];
	var numCols = props.columnContents.length;
	var width = props.width ? props.width : 12 / numCols;
	width = Number(width)
	for(var i = 0; i < numCols; i++) {
		cols.push(<Col key={i} xs={width}>{props.columnContents[i]}</Col>);
	}
	return (
		<Grid>
		    <Row className="show-grid">
		      {cols}
		    </Row>
    	</Grid>
	)
}

export default SimpleRow
