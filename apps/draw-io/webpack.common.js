const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
  plugins: [
    new VueLoaderPlugin()
  ],
  entry: {
    'draw-io': [
      'core-js/modules/es6.promise',
      'core-js/modules/es6.array.iterator',
      './src/app.js'
    ]
  },
  output: {
    publicPath: 'apps/draw-io/',
    chunkFilename: '[name].draw-io.chunk.js',
    filename: 'draw-io.bundle.js'
  },
  module: {
    rules: [{
      test: /\.js?$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      options: {
        rootMode: 'upward'
      }
    }, {
      test: /\.vue$/,
      loader: 'vue-loader'
    }, {
      test: /\.css$/,
      use: [
        'vue-style-loader',
        'css-loader'
      ]
    }]
  }
}
