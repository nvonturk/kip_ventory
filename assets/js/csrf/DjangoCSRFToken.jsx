import $ from 'jquery'
import React from 'react'

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie != '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = $.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
            cookieValue = decodeURIComponent(
                cookie.substring(name.length + 1)
            );
            break;
        }
    }
  }
  return cookieValue;
}

class DjangoCSRFToken extends React.Component {
    render(){
        var csrf_token = getCookie('csrftoken');
        return (<input type="hidden" name="csrfmiddlewaretoken" value={ csrf_token }/>);
    }
}

module.exports = {
    getCookie: getCookie,
    CSRFToken: DjangoCSRFToken
}
