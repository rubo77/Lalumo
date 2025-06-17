#! /bin/bash

# 1. Build the project
npm run build

# 2. Create images directory in dist if it doesn't exist
mkdir -p dist/images

# 3. Copy images, favicon, robots.txt and sitemap.xml from public directory to dist
cp -r public/images/* dist/images/
cp -r public/favicon.svg dist/
cp -r public/robots.txt dist/
cp -r public/sitemap.xml dist/

# 4. Upload to the server (both built files and images)
rsync -avz --no-perms --no-owner --no-group --delete dist/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.z11.de/

# 5. Upload homepage files to lalumo.eu
rsync -avz --no-perms --no-owner --no-group --delete homepage/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.eu/

echo "Deployment complete! All files including images have been uploaded."

echo "upload the git repo:"
rsync -avz --no-perms --no-owner --no-group --delete .git/ root@vm06.eclabs:/var/kunden/webs/ruben/git/lalumo.z11.de/

echo "done"