#! /bin/bash

# online 
SSH_P=root@vm06.eclabs:/var/kunden/webs/ruben/www

# 1. Build the project with subdirectory flag for correct asset paths
npm run build -- --env deploy=subdirectory

# 2. Stelle sicher, dass app-Verzeichnis existiert
mkdir -p dist

# 3. Kopiere alle statischen Assets in einem Schritt
cp -r public/* dist/

# 4. Upload to the server (both built files and images)
rsync -avz --no-perms --no-owner --no-group --delete dist/ $SSH_P/lalumo.z11.de/

# 4b. Upload to dist subdirectory on lalumo.eu
rsync -avz --no-perms --no-owner --no-group --delete dist/ $SSH_P/lalumo.eu/app/

rsync -avz --no-perms --no-owner --no-group src/api/ $SSH_P/lalumo.eu/api/

# Explizit die config.js synchronisieren, um sicherzustellen, dass die aktualisierte Version verwendet wird
rsync -avz --no-perms --no-owner --no-group src/config.js $SSH_P/lalumo.eu/app/
rsync -avz --no-perms --no-owner --no-group src/config.js $SSH_P/lalumo.eu/api/
rsync -avz --no-perms --no-owner --no-group src/config.js $SSH_P/lalumo.eu/
echo "Config file explicitly synchronized to dist/, api/ and root directories"

# 5. Upload homepage files to lalumo.eu root
rsync -avz --no-perms --no-owner --no-group homepage/ $SSH_P/lalumo.eu/
rsync -avz --no-perms --no-owner --no-group dist/homepage/images/ $SSH_P/lalumo.eu/images/
rsync -avz --no-perms --no-owner --no-group dist/images/backgrounds/ $SSH_P/lalumo.eu/images/backgrounds/
rsync -avz --no-perms --no-owner --no-group public/images/logo_bird_sings.jpg $SSH_P/lalumo.eu/images/
echo "Deployment complete! Homepage files at https://lalumo.eu and dist at https://lalumo.eu/dist"

echo "upload the git repo:"
rsync -avz --no-perms --no-owner --no-group --delete .git/ root@vm06.eclabs:/var/kunden/webs/ruben/git/lalumo.z11.de/

echo "done"