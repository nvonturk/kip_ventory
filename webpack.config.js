var path = require("path")
var webpack = require('webpack')

module.exports = {
  context: __dirname,

  entry: {
    app: './assets/js/app/index',
    login: './assets/js/login/index'
  }, // entry point of our app. assets/js/index.js should require other js modules and dependencies it needs

  output: {
      path: path.resolve('./kipventory/static/js/'),
      filename: "[name]-index.js",
  },

  plugins: [

  ],

  module: {
    loaders: [
      { test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader', // to transform JSX into JS
        query:
        {
          presets:['react', 'es2015']
        }
      }
    ],
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  },
}
