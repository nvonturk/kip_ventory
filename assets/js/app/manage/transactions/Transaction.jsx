import React from 'react'
import { Label } from 'react-bootstrap'

function Transaction(props){

	var label = null;
  	if(props.transaction.category=="Acquisition") {
    	label = <Label className="pull-right" bsStyle="success">{props.transaction.category}</Label>
	}
	else if(props.transaction.category=="Loss") {
		label = <Label className="pull-right" bsStyle="danger">{props.transaction.category}</Label>
	}
	else  if(label == null){
		console.log("Label equals null for " + props.transaction.category);
	}

	/* Ex:
		Acquisition of 10 resistors on Jan 1, 2017
		Administrator: kip
		Comment: bought them
	*/
	console.log(props);
  return (
  	<div>
  		<p>{props.transaction.category} of {props.transaction.quantity} {props.transaction.item}(s) on {new Date(props.transaction.date).toLocaleString()}</p>
    	<p>Administrator: {props.transaction.administrator} {label}</p>
    	<p>Comment: {props.transaction.comment}</p>
    </div>
    )
}

export default Transaction
