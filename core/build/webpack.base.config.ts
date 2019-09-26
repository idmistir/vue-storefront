import path from 'path';
import config from 'config';
import fs from 'fs';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import VueLoaderPlugin from 'vue-loader/lib/plugin';
import autoprefixer from 'autoprefixer';
import HTMLPlugin from 'html-webpack-plugin';
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
import webpack from 'webpack';
import dayjs from 'dayjs';

fs.writeFileSync(
  path.resolve(__dirname, './config.json'),
  JSON.stringify(config)
)

// eslint-disable-next-line import/first
import themeRoot from './theme-path';

// TODO: make it customizable via node env or something else that will be suitable once we have core separation
const projectRoot = '../../src'
const themesRoot = projectRoot + '/themes'

const moduleRoot = path.resolve(__dirname, '../../src/modules')
const themeResources = themeRoot + '/resource'
const themeCSS = themeRoot + '/css'
const themeApp = themeRoot + '/App.vue'
const themedIndex = path.join(themeRoot, '/index.html')

const csvDirectories = [
  path.resolve(__dirname, '../../node_modules/@vue-storefront/i18n/resource/i18n/')
]

fs.readdirSync(moduleRoot).forEach(directory => {
  const dirName = moduleRoot + '/' + directory + '/resource/i18n'

  if (fs.existsSync(dirName)) {
    csvDirectories.push(dirName);
  }
});

csvDirectories.push(path.resolve(__dirname, themeResources + '/i18n/'));

const translationPreprocessor = require('@vue-storefront/i18n/scripts/translation.preprocessor.js')
translationPreprocessor(csvDirectories, config)

const postcssConfig = {
  loader: 'postcss-loader',
  options: {
    ident: 'postcss',
    plugins: (loader) => [
      require('postcss-flexbugs-fixes'),
      require('autoprefixer')({
        flexbox: 'no-2009'
      })
    ]
  }
};
const isProd = process.env.NODE_ENV === 'production'
// todo: usemultipage-webpack-plugin for multistore
export default {
  plugins: [
    new webpack.ProgressPlugin(),
    // new BundleAnalyzerPlugin({
    //   generateStatsFile: true
    // }),
    new CaseSensitivePathsPlugin(),
    new VueLoaderPlugin(),
    // generate output HTML
    new HTMLPlugin({
      template: themedIndex,
      chunksSortMode: 'none',
      inject: isProd === false // in dev mode we're not using clientManifest therefore renderScripts() is returning empty string and we need to inject scripts using HTMLPlugin
    }),
    new webpack.DefinePlugin({
      'process.env.__APPVERSION__': JSON.stringify(require('../../package.json').version),
      'process.env.__BUILDTIME__': JSON.stringify(dayjs().format('YYYY-MM-DD HH:mm:ss'))
    })
  ],
  devtool: 'source-map',
  entry: {
    app: ['@babel/polyfill', './core/client-entry.ts']
  },
  output: {
    path: path.resolve(__dirname, '../../dist'),
    publicPath: '/dist/',
    filename: '[name].[hash].js'
  },
  resolveLoader: {
    modules: [
      'node_modules',
      path.resolve(__dirname, themesRoot)
    ]
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, themesRoot)
    ],
    extensions: ['.js', '.vue', '.gql', '.graphqls', '.ts'],
    alias: {
      // Main aliases
      'config': path.resolve(__dirname, './config.json'),
      'src': path.resolve(__dirname, '../../src'),

      // Theme aliases
      'theme': themeRoot,
      'theme/app': themeApp,
      'theme/css': themeCSS,
      'theme/resource': themeResources,
      '@vue-storefront/core': path.resolve(__dirname, '../'),
      // Backward compatible
      '@vue-storefront/core/lib/store/multistore': path.resolve(__dirname, '../lib/multistore.ts'),
      'src/modules/order-history/components/UserOrders': path.resolve(__dirname, '../../core/modules/order/components/UserOrdersHistory'),
      '@vue-storefront/core/modules/social-share/components/WebShare': path.resolve(__dirname, '../../src/themes/default/components/theme/WebShare.vue'),
      '@vue-storefront/core/helpers/initCacheStorage': path.resolve(__dirname, '../lib/storage-manager.ts')
    }
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.(js|vue,ts)$/,
        loader: 'eslint-loader',
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          preserveWhitespace: false,
          postcss: [autoprefixer()]
        }
      },
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\.vue$/],
          allowTsInNodeModules: true
        },
        include: [
          path.resolve(__dirname, '../../src'),
          path.resolve(__dirname, '../../core'),
          path.resolve(__dirname, '../../node_modules'),
          path.resolve(__dirname, '../../../shopware-pwa')
        ]      
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.resolve(__dirname, '../../src'),
          path.resolve(__dirname, '../../core')
        ]
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader',
          postcssConfig
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          postcssConfig,
          'sass-loader'
        ]
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          postcssConfig,
          {
            loader: 'sass-loader',
            options: {
              indentedSyntax: true
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2|eot|ttf)(\?.*$|$)/,
        loader: 'url-loader?importLoaders=1&limit=10000'
      },
      {
        test: /\.(graphqls|gql)$/,
        exclude: /node_modules/,
        loader: ['graphql-tag/loader']
      }
    ]
  }
}
