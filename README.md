# Requirements

* Node >= 12
* npm (or yarn)


# Installation

Clone the repo.
Initialize node_modules with:
```
npm install
```

# Development

Run the webpack-dev-server including live-reload with:
```
npm run watch
```

For the multiplayer mode, you also need to run the Socket.io server:
```
cd server
node server.js
```

The application will be available at http://localhost:9091 in your browser.
- Main page: http://localhost:9091/index.html
- Card library: http://localhost:9091/cards.html
- Multiplayer mode: http://localhost:9091/multiplayer.html


# Production

Bundle and build with:
```
npm run build
```
All files are then in the /dist folder

# Online Deployment

The application is deployed at: https://lalumo.z11.de/

To update the online version, follow these steps from the project's root directory:

```
# 1. Build the production files (this will create the /dist folder)
npm run build

# 2. Make sure the dist/ directory was created and contains all needed files
ls -la dist/

# 3. Upload to the server (make sure you're in the project root directory)
rsync -avz --no-perms --no-owner --no-group --delete dist/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.z11.de/

# 4. Resume development (optional)
npm run watch
```