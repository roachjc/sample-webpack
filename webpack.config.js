const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const merge = require('webpack-merge');
const glob = require('glob');
const webpack = require('webpack');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const parts = require('./webpack.parts');
const MonitorStats = require('./plugins/monitor-stats');
const statsFile = require('./monitor/stats.json');

const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build'),
};

// APPLIES TO ALL CONFIGURATIONS
// *****************************

const commonConfig = merge([
  {
    entry: {
      app: PATHS.app,
    },
    output: {
      path: PATHS.build,
      filename: '[name].js',
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: 'webpack demo',
      }),
      new MonitorStats(
        '../monitor/stats.json',
        { timings: true, source: false },
        statsFile
      ),
    ],
  },
  // parts.lintJavaScript({ include: PATHS.app }),
  parts.loadFonts({
    options: {
      name: '[name].[hash:8].[ext]',
    },
  }),
  parts.loadJavaScript({ include: PATHS.app }),
]);

// APPLIES TO PRODUCTION CONFIGS
// *****************************

const productionConfig = merge([
  {
    // Give warnings in terminal if size exceeds limits
    performance: {
      hints: 'warning',
      maxEntrypointSize: 100000,
      maxAssetSize: 450000,
    },
    output: {
      chunkFilename: '[name].[chunkhash:8].js',
      filename: '[name].[chunkhash:8].js',
    },
    plugins: [
      // Hash module names to enable client caching
      new webpack.HashedModuleIdsPlugin(),
      // Use bundle analyser ... opens static html in browser on build
      // new BundleAnalyzerPlugin({
      //   analyzerMode: 'static',
      //   reportFilename: 'report.html',
      //   defaultSizes: 'parsed',
      // }),
    ],
    // Helps with caching by assigning IDs to modules and storing here
    recordsPath: path.join(__dirname, 'records.json'),
  },
  // puts CSS in seperate file (use only on dev)
  parts.extractCSS({ use: 'css-loader' }),
  // removes unused css styles
  parts.purifyCSS({
    paths: glob.sync(`${PATHS.app}/**/*.js`, { nodir: true }),
  }),
  // limit inline image size. Larger images passed to file-loader instead
  parts.loadImages({
    options: {
      limit: 15000,
      name: '[name].[hash:8].[ext]',
    },
  }),
  parts.generateSourceMaps({ type: 'source-map' }),
  // Bundle Splitting
  parts.extractBundles([
    {
      name: 'vendor',
      minChunks: ({ resource }) => (
        // gets all the js files in node modules being used.
        resource &&
        resource.indexOf('node_modules') >= 0 &&
        resource.match(/\.js$/)
      ),
    },
    {
      name: 'manifest',
      minChunks: Infinity,
    },
  ]),
  // Remove unused files from target dir
  parts.clean(PATHS.build),
  // Minify (can also minify CSS & HTML)
  parts.minifyJavaScript(),  
  // Add comments to top of build files
  parts.attachRevision(),
  // Use DefinePlugin to replace free variables and allow minification to remove dead code.
  // See https://survivejs.com/webpack/optimizing/environment-variables/
  parts.setFreeVariable(
    'process.env.NODE_ENV',
    'production'
  ),
]);

// APPLIES TO DEVELOPMENT CONFIGS
// ******************************

const developmentConfig = merge([
  parts.devServer({
    host: process.env.HOST,
    port: process.env.PORT,
  }),
  // Load css
  parts.loadCSS(),
  // Inline images
  parts.loadImages(),
  parts.generateSourceMaps({ type: 'cheap-module-eval-souce-map' }),
]);

module.exports = (env) => {
  if (env === 'production') return merge(commonConfig, productionConfig);
  return merge(commonConfig, developmentConfig);
};
