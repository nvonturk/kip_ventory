import React, { Component } from 'react'
import { getJSON, ajax } from "jquery"
import RequestView from './RequestView'
import { getCookie } from '../../csrf/DjangoCSRFToken'
import { Grid, Row, Col, PageHeader, PanelGroup, Panel, Alert } from 'react-bootstrap'

class RequestListContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (<div>Hi</div>);
  }
}


export default RequestListContainer
