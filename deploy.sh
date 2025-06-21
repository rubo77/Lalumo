#! /bin/bash

# 1. Build the project with subdirectory flag for correct asset paths
npm run build -- --env deploy=subdirectory

# 2. Create images directory in dist if it doesn't exist
mkdir -p dist/images

# 3. Copy images, favicon, robots.txt and sitemap.xml from public directory to dist
cp -r public/images/* dist/images/
cp -r public/favicon.svg dist/
cp -r public/robots.txt dist/
cp -r public/sitemap.xml dist/

# 4. Upload to the server (both built files and images)
rsync -avz --no-perms --no-owner --no-group --delete dist/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.z11.de/

# 4b. Upload to app subdirectory on lalumo.eu
rsync -avz --no-perms --no-owner --no-group --delete dist/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.eu/app/

# 5. Upload homepage files to lalumo.eu root
rsync -avz --no-perms --no-owner --no-group homepage/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.eu/
rsync -avz --no-perms --no-owner --no-group app/homepage/images/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.eu/images/
rsync -avz --no-perms --no-owner --no-group app/images/backgrounds/ root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.eu/images/backgrounds/
rsync -avz --no-perms --no-owner --no-group public/images/logo_bird_sings.jpg root@vm06.eclabs:/var/kunden/webs/ruben/www/lalumo.eu/images/
echo "Deployment complete! Homepage files at https://lalumo.eu and app at https://lalumo.eu/app"

echo "upload the git repo:"
rsync -avz --no-perms --no-owner --no-group --delete .git/ root@vm06.eclabs:/var/kunden/webs/ruben/git/lalumo.z11.de/

echo "done"