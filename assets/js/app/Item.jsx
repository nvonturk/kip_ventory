import React from 'react'
import { Link } from 'react-router'

function Item(props) {
	var itemDetailUrl = "/app/items/" + props.item.name + "/";
	return (
			<Link to={itemDetailUrl}>
	 		 <div className="profile-header-container rect clickable">
	 		 	<div className="rank-label-container">
	            	<span className="rank-label">{props.item.name}</span>
	            </div>
	    		<div className="profile-header-img">
	            	<img className="img-circle" src={props.item.photo_src} />
	            </div>
	          </div>
	        </Link>   
	     )
}

export default Item
