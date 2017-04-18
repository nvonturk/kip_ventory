import React from 'react'
import { Grid, Row, Col } from 'react-bootstrap'
import { render } from 'react-dom'
import { Router, Redirect, Route, browserHistory, IndexRoute } from 'react-router'
import KipNav from './KipNav'
// import Home from './Home'

// ADMIN PAGES
import AdminContainer from './admin/AdminContainer'
import LocalUserCreationForm from './admin/usercreation/LocalUserCreationForm'
import UserPrivilegesContainer from './admin/users/UserPrivilegesContainer'
import AdminWelcome from './admin/welcome/AdminWelcome'
import DjangoAdminPanelLink from './admin/DjangoAdminPanelLink'


// Manager Pages
import ManagerContainer from './manage/ManagerContainer'
import ManagerWelcome from './manage/welcome/ManagerWelcome'
import ItemCreationForm from './manage/items/ItemCreationForm'
import CustomFieldContainer from './manage/customfields/CustomFieldContainer'
import DisbursementContainer from './manage/disbursement/DisbursementContainer'
import ManagerRequestsContainer from './manage/requests/ManagerRequestsContainer'
import TransactionsContainer from './manage/transactions/TransactionsContainer'
import LogsContainer from './manage/logs/LogsContainer'
import TagsContainer from './manage/tags/TagsContainer'
import EmailsContainer from './manage/emails/EmailsContainer'
import ManagerLoansContainer from './manage/loans/ManagerLoansContainer'


// MAIN APP PAGES
import InventoryContainer from './inventory/InventoryContainer'
import CartContainer from './cart/CartContainer'
import RequestsContainer from './requests/RequestsContainer'
import LoansContainer from './loans/LoansContainer'
import Profile from './profile/Profile'
import {getJSON} from 'jquery'

import UserDetail from './inventory/detail/UserDetail'
import ManagerDetail from './inventory/detail/ManagerDetail'
import ManagerRequestDetail from './requests/detail/ManagerRequestDetail'
import UserRequestDetail from './requests/detail/UserRequestDetail'
// import RequestDetail from './requests/RequestDetail'

function getManagerPanel(userData) {
  return userData.is_staff ? (
    <Route path="manage" component={ManagerContainer} admin={userData}>
      <IndexRoute component={ManagerWelcome} admin={userData} />
      <Route path="disburse" component={DisbursementContainer} admin={userData} />
      <Route path="requests" component={ManagerRequestsContainer} admin={userData} />
      <Route path="loans" component={ManagerLoansContainer} admin={userData} />
      <Route path="transactions" component={TransactionsContainer} admin={userData} />
      <Route path="logs" component={LogsContainer} admin={userData} />
      <Route path="tags" component={TagsContainer} admin={userData} />
      <Route path="emails" component={EmailsContainer} admin={userData} />
    </Route>) : null
}

function getAdminPanel(userData) {
  return userData.is_superuser ? (
    <Route path="admin" component={AdminContainer} admin={userData}>
      <IndexRoute component={AdminWelcome} admin={userData} />
      <Route path="users/create/" component={LocalUserCreationForm} admin={userData} />
      <Route path="users/manage/" component={UserPrivilegesContainer} admin={userData} />
      <Route path="adminpanel/" component={DjangoAdminPanelLink} admin={userData} />
      <Route path="custom-fields" component={CustomFieldContainer} admin={userData} />
    </Route>) : null
}

function getItemDetailRoute(userData) {
  return (userData.is_staff || userData.is_superuser) ? (
    <Route path=":item_name" component={ManagerDetail} user={userData} />
  ) : (
    <Route path=":item_name" component={UserDetail} user={userData} />
  )
}

function getRequestDetailRoute(userData) {
  return (userData.is_staff || userData.is_superuser) ? (
    <Route path="requests/:request_id" component={ManagerRequestDetail} user={userData} />
  ) : (
    <Route path="requests/:request_id" component={UserRequestDetail} user={userData} />
  )
}

const My404Component = React.createClass({
  getInitialState() {
    return {}
  },

  render() {
    return (
      <Grid>
        <Col sm={12}>
          <h3>404 - not found</h3>
          <hr />
        </Col>
      </Grid>
    )
  }
})

function initialize(userData) {
  render((
    <Router history={browserHistory}>
      <Route path="app" component={KipNav} user={userData}>
        <Route path="inventory" user={userData}>
          <IndexRoute component={InventoryContainer} user={userData} />
          { getItemDetailRoute(userData) }
        </Route>

        <Route path="requests" component={RequestsContainer} user={userData} />
        { getRequestDetailRoute(userData) }

        <Route path="loans" component={LoansContainer} user={userData} />
        { getManagerPanel(userData) }
        { getAdminPanel(userData) }

        <Route path="cart" component={CartContainer} user={userData} />
        <Route path="settings" component={Profile} user={userData} />
        <Route path='404' component={My404Component} />
      </Route>
      <Redirect from='*' to='/app/404/' />
    </Router>),
    document.getElementById('root'));
}


getJSON("/api/users/current/", function(data) {
   var user = data
   initialize(user)
})
