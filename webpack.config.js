const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Funktion zum Finden der Template-Dateien
function findHomepageTemplates() {
  const templatesDir = path.join(__dirname, 'homepage');
  const files = fs.readdirSync(templatesDir);
  return files
    .filter(file => file.endsWith('-template.html'))
    .map(file => ({
      template: path.join(templatesDir, file),
      filename: file.replace('-template', '')
    }));
}

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const homepageTemplates = findHomepageTemplates();
  
  return {
    entry: {
      main: './src/index.js',
    },
    resolve: {
      modules: [path.resolve(__dirname), 'node_modules'],
      extensions: ['.js'],
      preferRelative: true,
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
          watch: true
        },
        {
          directory: path.join(__dirname, 'src'),
          publicPath: '/src',
          watch: true
        }
      ],
      port: 9091,
      hot: true,
      open: true,
      watchFiles: {
        paths: ['src/**/*.html', 'homepage/*-template.html'],
        options: {
          usePolling: true,
          interval: 300 // Schnelleres Polling alle 300ms
        }
      },
    },
    module: {
      rules: [
        // Regel für Bilddateien
        {
          test: /\.(jpg|jpeg|png|gif|svg)$/,
          type: 'asset/resource',
          generator: {
            filename: 'images/screenshots/[name][ext]'
          }
        },
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
          exclude: [
            /index\.html$/,
            /-template\.html$/
          ],
          use: {
            loader: 'html-loader',
            options: {
              minimize: false,
              esModule: false
            }
          }
        },
        // Spezielle Regel für mehrsprachige Template-Dateien
        {
          test: /-template\.html$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'html-loader',
              options: {
                minimize: false,
                esModule: false,
                sources: false
              }
            },
            {
              loader: path.resolve(__dirname, 'webpack/language-loader.js')
            }
          ]
        },
        // YAML support removed - using JS config directly

      ],
    },
    plugins: [
      // Hauptapp index.html unter /app/index.html
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'app/index.html',
        chunks: ['main'],
        inject: true,
        hash: true,
        publicPath: isProduction && env.deploy === 'subdirectory' ? './' : '../',
        minify: {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          useShortDoctype: true
        }
      }),
      
      // Englische Homepage-Templates (root)
      ...homepageTemplates.map(template => new HtmlWebpackPlugin({
        template: `${template.template}?language=en`, // Query-Parameter hinzufügen, um Template-Caching zu verhindern
        filename: template.filename,
        publicPath: '/',
        minify: false,
        inject: false,
        templateParameters: {
          language: 'en'
        }
      })),
      
      // Deutsche Homepage-Templates (de/)
      ...homepageTemplates.map(template => new HtmlWebpackPlugin({
        template: `${template.template}?language=de`, // Query-Parameter hinzufügen, um Template-Caching zu verhindern
        filename: `de/${template.filename}`,
        publicPath: '/',
        minify: false,
        inject: false,
        templateParameters: {
          language: 'de'
        }
      })),
      new MiniCssExtractPlugin({
        // Für Subdirectory-Deployment: Entferne Content-Hash für konsistente Dateinamen
        filename: isProduction && env.deploy === 'subdirectory' ? '[name].css' : '[name].[contenthash].css',
      }),
      // Copy homepage assets to dist, de/ directory, and app/ directory (root paths, /de/ paths, and /app/ paths)
      new CopyWebpackPlugin({
        patterns: [
          { from: 'homepage/icons', to: 'icons' },
          { from: 'homepage/icons', to: 'de/icons' },
          { from: 'homepage/icons', to: 'app/icons' },  // Auch für App-Verzeichnis kopieren
          { from: 'public/images/backgrounds', to: 'images/backgrounds' },
          { from: 'public/images/backgrounds', to: 'de/images/backgrounds' },
          { from: 'public/images/backgrounds', to: 'app/images/backgrounds' },  // Auch für App-Verzeichnis kopieren
          { from: 'public/images', to: 'images' },
          { from: 'public/images', to: 'de/images' },
          { from: 'public/images', to: 'app/images' },  // Auch für App-Verzeichnis kopieren
          { 
            from: 'src/favicon.ico',
            to: 'de/favicon.ico'
          },
          { 
            from: 'public/strings-*.xml',
            to: 'app/[name][ext]'
          },
          {
            from: 'public/images',
            to: 'images'
          },
          {
            // Copy selected background images for homepage screenshots
            from: 'public/images/backgrounds/pitches_action1_3.jpg',
            to: 'images/screenshots/pitches_action1_3.jpg'
          },
          {
            from: 'public/images/backgrounds/pitches_action1_1_sloth_mouse.jpg',
            to: 'images/screenshots/pitches_action1_1_sloth_mouse.jpg'
          },
          {
            from: 'public/images/backgrounds/pitches_bird_sings.jpg',
            to: 'images/screenshots/pitches_bird_sings.jpg'
          },
          {
            // Copy selected background images for German version
            from: 'public/images/backgrounds/pitches_action1_3.jpg',
            to: 'de/images/screenshots/pitches_action1_3.jpg'
          },
          {
            from: 'public/images/backgrounds/pitches_action1_1_sloth_mouse.jpg',
            to: 'de/images/screenshots/pitches_action1_1_sloth_mouse.jpg'
          },
          {
            from: 'public/images/backgrounds/pitches_bird_sings.jpg',
            to: 'de/images/screenshots/pitches_bird_sings.jpg'
          },
          {
            // Copy package.json for version display in credits
            from: 'package.json',
            to: 'package.json'
          },
          // Icons für Root-Version
          {
            from: 'homepage/icons',
            to: 'icons',
          },
          // Icons für deutsche Version
          {
            from: 'homepage/icons',
            to: 'de/icons',
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
