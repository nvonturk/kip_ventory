import React from 'react'
import { Row, Col, Table, Label} from 'react-bootstrap'

/*
Usage: <LoanInfoView loan={loan} request={request} />
where 
loan={
	quantity_loaned: integer,
	quantity_returned: integer,
	asset: string or null, 
	item: string, 
	date_loaned: date,
}, 
request={
	requester: string, 
	open_comment: string, 
	closed_comment: string
}
Note: wrap it in a <Grid />
*/
function LoanInfoView(props) {
	if (props.loan == null) {
    return null;
  } else {
	  var statusLabel = (props.loan.quantity_loaned == props.loan.quantity_returned) ? (
	    <Label bsSize="small" bsStyle="success">Returned</Label>
	  ) : (
	    <Label bsSize="small" bsStyle="warning">Outstanding</Label>
	  )
	  var assetTag = (props.loan.asset != null) ? (
	    <tr>
	      <th style={{width:"20%"}}>Asset Tag:</th>
	      <td style={{width:"80%"}}><span style={{color: "rgb(223, 105, 26)"}}>{props.loan.asset}</span></td>
	    </tr>
	  ) : null

		return (
			<div>
				<Row>
		        <Col xs={12}>
		          <span style={{float:"right", fontSize:"12px"}}>Status: &nbsp; &nbsp; {statusLabel}</span>
		        </Col>
		    </Row>
		    <Row>
		      <Col md={12} xs={12}>
		        <Table condensed style={{fontSize:"14px"}}>
		          <tbody>
		            <tr>
		              <th style={{width:"30%"}}>Item:</th>
		              <td style={{width:"70%"}}><span style={{color: "rgb(223, 105, 26)"}}>{props.loan.item}</span></td>
		            </tr>
		            { assetTag }
		            <tr>
		              <th style={{width:"30%", verticalAlign: "middle"}}>Loaned to:</th>
		              <td style={{width:"70%", verticalAlign: "middle"}}>{props.request.requester}</td>
		            </tr>
		            <tr>
		              <th style={{width:"30%", verticalAlign: "middle"}}>Justification:</th>
		              <td style={{width:"70%", verticalAlign: "middle"}}>{props.request.open_comment}</td>
		            </tr>
		            <tr>
		            <th style={{width:"30%", verticalAlign: "middle"}}>Approval date:</th>
		            <td style={{width:"70%", verticalAlign: "middle"}}>{new Date(props.loan.date_loaned).toLocaleString()}</td>

		            </tr>
		            <tr>
		              <th style={{width:"30%", verticalAlign: "middle"}}>Admin comments:</th>
		              <td style={{width:"70%", verticalAlign: "middle"}}>{props.request.closed_comment}</td>
		            </tr>
		            <tr>
		              <th style={{width:"30%", verticalAlign: "middle"}}>Number Loaned:</th>
		              <td style={{width:"70%", verticalAlign: "middle"}}>{props.loan.quantity_loaned} instance(s)</td>
		            </tr>
		            <tr>
		              <th style={{width:"30%", verticalAlign: "middle"}}>Number Returned:</th>
		              <td style={{width:"70%", verticalAlign: "middle"}}>{props.loan.quantity_returned} instance(s)</td>
		            </tr>
		          </tbody>
		        </Table>
		      </Col>
		    </Row>
      </div>
		)
	}
}

export default LoanInfoView
