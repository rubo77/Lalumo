const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

// Helper function to minify XML content
function minifyXML(content) {
  return content.toString()
    .replace(/^[ \t]+/gm, '')  // Remove leading whitespace from each line
    .replace(/\r?\n\s*/g, '')    // Remove all line breaks and following whitespace
    .replace(/>\s+</g, '><')    // Remove whitespace between tags
    .replace(/\s+\/>/g, '/>')  // Remove whitespace before self-closing tags
    .trim();
}

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
      // Fix HMR: Use absolute path for dev server, relative for production
      publicPath: isProduction ? './' : '/',
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
      historyApiFallback: {
        rewrites: [
          { from: /^\/app/, to: '/app/index.html' },
          { from: /./, to: '/index.html' }
        ]
      },
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
        // Fix HMR: Use same publicPath as global config
        publicPath: isProduction ? '../' : '/',
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
          // Partials für Haupt-App und App-Verzeichnis kopieren
          { from: 'public/partials', to: 'partials' },
          { from: 'public/partials', to: 'app/partials' },
          
          // API-Dateien kopieren
          { from: 'src/api', to: 'api' },
          { from: 'src/api', to: 'app/api' },
          
          // Wichtige Konfigurationsdatei für die API - nicht minimieren, damit PHP-Parsing funktioniert
          { from: 'src/config.js', to: 'config.js', transform: (content) => content },
          { from: 'src/config.js', to: 'app/config.js', transform: (content) => content },
          { from: 'src/config.js', to: 'api/config.js', transform: (content) => content },
          { from: 'src/config.js', to: 'app/api/config.js', transform: (content) => content },
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
          // Process and minify XML files from source and copy to multiple locations
          {
            from: 'android/app/src/main/res/values/strings.xml',
            to: 'app/strings-en.xml',
            transform: minifyXML
          },
          {
            from: 'android/app/src/main/res/values/strings.xml',
            to: 'strings-en.xml',
            transform: minifyXML
          },
          // Minify the source files in the public directory
          {
            from: 'android/app/src/main/res/values/strings.xml',
            to: '../public/strings-en.xml',
            transform: minifyXML
          },
          {
            from: 'android/app/src/main/res/values/strings.xml',
            to: 'public/strings-en.xml',
            transform: minifyXML
          },
          {
            from: 'android/app/src/main/res/values-de/strings.xml',
            to: 'app/strings-de.xml',
            transform: minifyXML
          },
          {
            from: 'android/app/src/main/res/values-de/strings.xml',
            to: 'strings-de.xml',
            transform: minifyXML
          },
          // Minify the source files in the public directory
          {
            from: 'android/app/src/main/res/values-de/strings.xml',
            to: '../public/strings-de.xml',
            transform: minifyXML
          },
          {
            from: 'android/app/src/main/res/values-de/strings.xml',
            to: 'public/strings-de.xml',
            transform: minifyXML
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
          // Copy piano sound samples
          {
            from: 'public/sounds/piano',
            to: 'sounds/piano',
          },
          // Also copy piano samples to app/ directory to maintain consistency
          {
            from: 'public/sounds/piano',
            to: 'app/sounds/piano',
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
          },
          // Homepage images für Root-Version
          {
            from: 'homepage/images',
            to: 'homepage/images',
          },
          // Homepage images für deutsche Version
          {
            from: 'homepage/images',
            to: 'de/homepage/images',
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
