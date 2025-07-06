#! /bin/bash

# online 
SSH_HOST=root@vm06.eclabs
SSH_PATH=/var/kunden/webs/ruben/www/lalumo.eu/www/

# 1. Build the project with standardized configuration
npm run build

# 2. Sync the entire dist directory to the server with one command
echo "Syncing entire dist/ directory to server..."
rsync -avz --no-perms --no-owner --no-group --delete dist/ $SSH_HOST:$SSH_PATH

echo "Deployment complete! Homepage files at https://lalumo.eu (EN) and https://lalumo.eu/de/ (DE) and app at https://lalumo.eu/app"

echo "Uploading git repository..."
rsync -avz --no-perms --no-owner --no-group --delete .git/ root@vm06.eclabs:/var/kunden/webs/ruben/git/lalumo.z11.de/

echo "done"