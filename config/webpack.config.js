const path = require('path');
const glob = require('glob');

const webpack = require('webpack');
const StatsWriterPlugin = require('webpack-stats-plugin').StatsWriterPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const ROOT_PATH = path.resolve(__dirname, '..');
const CACHE_PATH = process.env.WEBPACK_CACHE_PATH || path.join(ROOT_PATH, 'tmp/cache');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const IS_WATCH_FILE = process.env.IS_WATCH_FILE === 'true';

const WEBPACK_REPORT = process.env.WEBPACK_REPORT;
const NO_COMPRESSION = process.env.NO_COMPRESSION;
const NO_SOURCEMAPS = process.env.NO_SOURCEMAPS;

const devtool = IS_PRODUCTION ? 'source-map' : 'cheap-module-eval-source-map';

let autoEntriesCount = 0;
let watchAutoEntries = [];
const defaultEntries = ['./main'];

function generateEntries() {
  // generate automatic entry points
  const autoEntries = {};
  const autoEntriesMap = {};
  const pageEntries = glob.sync('pages/**/index.js', {
    cwd: path.join(ROOT_PATH, 'app/javascripts'),
  });
  watchAutoEntries = [path.join(ROOT_PATH, 'app/javascripts/pages/')];

  function generateAutoEntries(path, prefix = '.') {
    const chunkPath = path.replace(/\/index\.js$/, '');
    const chunkName = chunkPath.replace(/\//g, '.');
    autoEntriesMap[chunkName] = `${prefix}/${path}`;
  }

  pageEntries.forEach(path => generateAutoEntries(path));
  
  const autoEntryKeys = Object.keys(autoEntriesMap);
  autoEntriesCount = autoEntryKeys.length;

  // import ancestor entrypoints within their children
  autoEntryKeys.forEach(entry => {
    const entryPaths = [autoEntriesMap[entry]];
    const segments = entry.split('.');
    while (segments.pop()) {
      const ancestor = segments.join('.');
      if (autoEntryKeys.includes(ancestor)) {
        entryPaths.unshift(autoEntriesMap[ancestor]);
      }
    }
    autoEntries[entry] = defaultEntries.concat(entryPaths);
  });
  return autoEntries;
}

module.exports = {
  mode: IS_PRODUCTION ? 'production' : 'development',

  context: path.join(ROOT_PATH, 'app/javascripts'),

  entry: generateEntries,

  output: {
    path: path.join(ROOT_PATH, 'dist/asset/js'),
    publicPath: 'dist/asset/js/',
    filename: IS_PRODUCTION ? '[name].[chunkhash:8].bundle.js' : '[name].bundle.js',
    chunkFilename: IS_PRODUCTION ? '[name].[chunkhash:8].chunk.js' : '[name].chunk.js',
    globalObject: 'this', // allow HMR and web workers to play nice
  },

  resolve: {
    extensions: ['.js', '.gql', '.graphql'],
    alias: {
      '~': path.join(ROOT_PATH, 'app/javascripts'),
      // alias 只能替换 import中的路径 并非全局 全局提示可以用 webstorm resource root设置为 app 解决
      // 'stylesheets': path.join(ROOT_PATH,'app/stylesheets'),
      // 'images': path.join(ROOT_PATH,'app/images'),
      // 'icons': path.join(ROOT_PATH,'app/icons'),
      // 'fonts': path.join(ROOT_PATH,'app/fonts'),
      // 'public': path.join(ROOT_PATH,'public')
    },
  },

  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.js$/,
        exclude: path => /node_modules/.test(path) && !/\.vue\.js/.test(path),
        loader: 'babel-loader',
        options: {
          cacheDirectory: path.join(CACHE_PATH, 'babel-loader'),
        },
      },
    ],
  },

  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      maxInitialRequests: 4,
      cacheGroups: {
        default: false,
        common: () => ({
          priority: 20,
          name: 'main',
          chunks: 'initial',
          minChunks: autoEntriesCount * 0.9,
        }),
        vendors: {
          priority: 10,
          chunks: 'async',
          test: /[\\/](node_modules|vendor[\\/]assets[\\/]javascripts)[\\/]/,
        },
        commons: {
          chunks: 'all',
          minChunks: 2,
          reuseExistingChunk: true,
        },
      },
    },
  },
  watch: IS_WATCH_FILE,
  plugins: [
    // manifest filename must match config.webpack.manifest_filename
    // webpack-rails only needs assetsByChunkName to function properly
    new StatsWriterPlugin({
      filename: 'manifest.json',
      transform: function(data, opts) {
        const stats = opts.compiler.getStats().toJson({
          chunkModules: false,
          source: false,
          chunks: false,
          modules: false,
          assets: true,
        });
        return JSON.stringify(stats, null, 2);
      },
    }),

    // prevent pikaday from including moment.js
    new webpack.IgnorePlugin(/moment/, /pikaday/),

    // fix legacy jQuery plugins which depend on globals
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    }),
    
    // compression can require a lot of compute time and is disabled in CI
    IS_PRODUCTION && !NO_COMPRESSION && new CompressionPlugin(),
    
    // optionally generate webpack bundle analysis
    WEBPACK_REPORT &&
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        generateStatsFile: true,
        openAnalyzer: false,
        reportFilename: path.join(ROOT_PATH, 'webpack-report/index.html'),
        statsFilename: path.join(ROOT_PATH, 'webpack-report/stats.json'),
      }),
  ].filter(Boolean),
  
  devtool: NO_SOURCEMAPS ? false : devtool,

  // sqljs requires fs
  node: { fs: 'empty' },
};
