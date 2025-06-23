const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: {
      main: './src/index.js',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      // Immer Content-Hash für Cache-Busting verwenden
      filename: '[name].[contenthash].js',
      clean: true,
      // publicPath anpassen für Produktion vs. Entwicklung
      // Für Subdirectory-Deployment: './' für relative Pfade ohne führenden Slash
      publicPath: isProduction && env.deploy === 'subdirectory' ? './' : './',
    },
    // Copy static assets from public directory
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'homepage'),
          publicPath: '/homepage',
        }
      ],
      port: 9091,
      hot: true,
      open: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        // CSS processing disabled for testing (enable when needed)
        //* 
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        // */
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp3|wav)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'images/[name][ext]'
          }
        },
        {
          test: /\.html$/,
          exclude: /index\.html$/,
          use: {
            loader: 'html-loader',
            options: {
              minimize: false,
              esModule: false
            }
          }
        },
        // YAML support removed - using JS config directly

      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
        // Ensure correct asset paths for subdirectory deployment
        publicPath: isProduction && env.deploy === 'subdirectory' ? './' : './',
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        }
      }),
      new MiniCssExtractPlugin({
        // Für Subdirectory-Deployment: Entferne Content-Hash für konsistente Dateinamen
        filename: isProduction && env.deploy === 'subdirectory' ? '[name].css' : '[name].[contenthash].css',
      }),
      // Copy XML files to root for app access
      new CopyWebpackPlugin({
        patterns: [
          { 
            from: 'public/strings-*.xml',
            to: '[name][ext]'
          },
          {
            from: 'public/images',
            to: 'images'
          },
          {
            // Copy selected background images for homepage screenshots
            from: 'public/images/backgrounds/pitches_action1_3.jpg',
            to: 'homepage/images/screenshots/pitches_action1_3.jpg'
          },
          {
            from: 'public/images/backgrounds/pitches_action1_1_sloth_mouse.jpg',
            to: 'homepage/images/screenshots/pitches_action1_1_sloth_mouse.jpg'
          },
          {
            from: 'public/images/backgrounds/pitches_bird_sings.jpg',
            to: 'homepage/images/screenshots/pitches_bird_sings.jpg'
          },
          {
            // Copy package.json for version display in credits
            from: 'package.json',
            to: 'package.json'
          }
        ],
      }),
    ],
    resolve: {
      extensions: ['.js'],
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};
