import React from 'react'
import SimpleRequest from './simplerequest'

function Request(props){
  return <div><b>Item:</b> {props.request.item.name}  <SimpleRequest request={props.request}/></div>
}

export default Request