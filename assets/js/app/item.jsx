import React from 'react'

function Item(props) {
	return (
	 		 <div onClick={props.onClick} className="profile-header-container rect clickable">
	 		 	<div className="rank-label-container">
	            	<span className="rank-label">{props.item.name}</span>
	            </div>   
	    		<div className="profile-header-img">
	            	<img className="img-circle" src="//lh3.googleusercontent.com/-6V8xOA6M7BA/AAAAAAAAAAI/AAAAAAAAAAA/rzlHcD0KYwo/photo.jpg?sz=120" />
	            </div>
	        </div> 
    )
}

export default Item