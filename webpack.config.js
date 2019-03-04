const path = require('path');

module.exports = {
    mode: "development",
    optimization: {
        removeAvailableModules: false,
        removeEmptyChunks: false
    },
    resolve: {
        extensions: ['.js']
    },
    entry: './_compiled/App.js',
    output: {
        path: path.resolve(__dirname, "docs/assets"),
        filename: 'App.js',
        pathinfo: false
    }
  };