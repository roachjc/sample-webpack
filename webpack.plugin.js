const path = require('path');

const DemoPlugin = require('./plugins/demo-plugin');
const StatsPlugin = require('stats-webpack-plugin');

const PATHS = {
  lib: path.join(__dirname, 'lib'),
  build: path.join(__dirname, 'build'),
};

module.exports = {
  entry: {
    lib: PATHS.lib,
  },
  output: {
    path: PATHS.build,
    filename: '[name].js',
  },
  plugins: [
    new DemoPlugin('../stats.json', 'normal'),
    // new StatsPlugin(
    //   '../stats/statsFromPlugin.json',
    //   {
    //     chunkModules: true,
    //     exclude: [/node_modules[\\\/]react/],
    //   },
    //   []
    // ),
  ],
};
