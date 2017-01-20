var React = require('react')
var ReactDOM = require('react-dom')

var ItemsList = React.createClass({
    loadItemsFromServer: function(){
        $.ajax({
            url: this.props.url,
            datatype: 'json',
            cache: false,
            success: function(data) {
                this.setState({data: data});
            }.bind(this)
        })
    },

    getInitialState: function() {
        return {data: []};
    },

    componentDidMount: function() {
        this.loadItemsFromServer();
    },
    render: function() {
        if (this.state.data) {
            console.log('DATA!')
            var itemNodes = this.state.data.map(function(item){
                return <li> {item.name} </li>
            })
        }
        return (
            <div>
                <h1>Hello React!</h1>
                <ul>
                    {itemNodes}
                </ul>
            </div>
        )
    }
})

ReactDOM.render(<ItemsList url='/api/' />,
    document.getElementById('container'))
