import React from 'react'
import { Grid, Row, Col } from 'react-bootstrap'
import ReactPaginate from 'react-paginate'

function Paginator(props) {

  return (
    <Grid>
      <Row className="show-grid relative-container">
        <Col xs={12}>
           <ReactPaginate previousLabel={"previous"}
                   nextLabel={"next"}
                   breakLabel={<a href="">...</a>}
                   breakClassName={"break-me"}
                   pageCount={props.pageCount}
                   marginPagesDisplayed={2}
                   pageRangeDisplayed={5}
                   onPageChange={props.onPageChange}
                   forcePage={props.forcePage}
                   containerClassName={"pagination"}
                   subContainerClassName={"pages pagination"}
                   activeClassName={"active"} />
        </Col>
      </Row>
    </Grid>
  )
}

export default Paginator