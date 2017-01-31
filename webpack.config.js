var path = require("path")
var webpack = require('webpack')

module.exports = {
  context: __dirname,

  entry: {
    landing: './assets/js/landing/Landing',
    app: './assets/js/app/App',
    login: './assets/js/login/Login', 
    cart: './assets/js/cart/Cart'
  }, // entry point of our app. assets/js/index.js should require other js modules and dependencies it needs

  output: {
      path: path.resolve('./kipventory/static/js/'),
      filename: "[name].js",
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
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader"
      }
    ],
  },

  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.js', '.jsx']
  },
}
