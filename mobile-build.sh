#!/bin/bash
# Multi-platform build script for Lalumo app using Capacitor
# This script builds the web app and syncs it with Android and iOS platforms

# Default configuration
UPDATE_VERSION=false
FORCE_SYNC=false
PLATFORM=""

# Show help information
show_help() {
  echo "\nLalumo Mobile Build Script\n"
  echo "Usage: bash mobile-build.sh [options] [platform]\n"
  echo "Options:"
  echo "  -h, --help                Show this help message"
  echo "  -u, --update-version      Update version: extract current version from 'package."
  echo "                            json' and increment minor version, then update 'build.gradle'"
  echo "                            and 'dev/add_changelog.sh'"
  echo ""
  echo "Platforms:"
  echo "  android    Build and open Android project"
  echo "  ios        Build and open iOS project"
  echo "  update     Only update native apps with latest web code"
  echo ""
  exit 0
}

# Process command line arguments
parse_args() {
  PLATFORM=""
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        ;;
      -u|--update-version)
        UPDATE_VERSION=true
        shift
        ;;
      android|ios|update)
        PLATFORM=$1
        shift
        ;;
      *)
        echo "Unknown option: $1"
        show_help
        ;;
    esac
  done
}

# Platform initialization
echo "###### 1. Initializing build for platform: ${PLATFORM:-all}"


# Update version in package.json and sync to build.gradle
update_version() {
  PACKAGE_FILE="package.json"
  GRADLE_FILE="android/app/build.gradle"
  CHANGELOG_GENERATOR_FILE="dev/add_changelog.sh"
  
  if [ ! -f "$PACKAGE_FILE" ]; then
    echo "Error: package.json not found!"
    return 1
  fi
  
  # extract current version from package.json
  CURRENT_VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$PACKAGE_FILE")
  
  if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not find version in package.json"
    return 1
  fi
  
  # split version into major.minor
  MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
  MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
  
  # Check if minor version is 99, then rollover to next major version
  if [ "$MINOR" -eq 99 ]; then
    NEW_MAJOR=$((MAJOR + 1))
    NEW_MINOR=0
    NEW_VERSION="$NEW_MAJOR.$NEW_MINOR"
    echo "Major version rollover: $CURRENT_VERSION → $NEW_VERSION (minor reached 99)"
  else
    # increment minor version (no patch version)
    NEW_MINOR=$((MINOR + 1))
    NEW_VERSION="$MAJOR.$NEW_MINOR"
  fi
  
  echo "###### 2. Updating version in package.json: $CURRENT_VERSION → $NEW_VERSION"
  
  # update version in package.json
  sed -i "s/\"version\":\s*\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
  
  # update package-lock.json
  echo "Updating package-lock.json..."
  npm install --package-lock-only --quiet
  
  # Version für Android verwenden (immer nur Major.Minor Format)
  ANDROID_VERSION="$NEW_VERSION"
  
  echo "###### 2.1 Updating version in build.gradle"
  if [ -f "$GRADLE_FILE" ]; then
    # Extrahiere aktuelle versionCode
    CURRENT_CODE=$(grep -oP 'versionCode\s+\K\d+' "$GRADLE_FILE")
    
    if [ -n "$CURRENT_CODE" ]; then
      # versionCode inkrementieren
      NEW_CODE=$((CURRENT_CODE + 1))
      echo "Updating Android versionCode: $CURRENT_CODE → $NEW_CODE"
      
      # versionCode in gradle file ersetzen
      
      # versionCode auch in package.json einfügen für Web-App
      echo "Injecting versionCode into package.json: $NEW_CODE"
      # Prüfe ob versionCode bereits existiert
      if grep -q "versionCode" "$PACKAGE_FILE"; then
        # Ersetze bestehende versionCode
        sed -i "s/\"versionCode\":\s*[0-9]*/\"versionCode\": $NEW_CODE/" "$PACKAGE_FILE"
      else
        # Füge versionCode nach version hinzu
        sed -i "/"version":/a\  "versionCode": $NEW_CODE," "$PACKAGE_FILE"
      fi
      sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$GRADLE_FILE"
      
      # Update versionName with new version from package.json
      echo "###### 2.1.1 Updating Android versionName"
      echo "New Android versionName: $ANDROID_VERSION"
      sed -i "s/versionName \"[^\"]*\"/versionName \"$ANDROID_VERSION\"/" "$GRADLE_FILE"
    else
      echo "Could not find versionCode in $GRADLE_FILE"
    fi
  else
    echo "Android gradle file not found at $GRADLE_FILE"
  fi
  
  # Version in add_changelog.sh aktualisieren
  echo "###### 2.2 Updating version in dev/add_changelog.sh"
  if [ -f "$CHANGELOG_GENERATOR_FILE" ]; then
    echo "New version in changelog generator: $ANDROID_VERSION"
    # Ersetze die VERSION_NAME-Zeile in der add_changelog.sh
    sed -i "s/VERSION_NAME=[0-9.]\+/VERSION_NAME=$ANDROID_VERSION/" "$CHANGELOG_GENERATOR_FILE"
  else
    echo "Changelog generator file not found at $CHANGELOG_GENERATOR_FILE"
  fi
}

# Parse command line arguments
parse_args "$@"

# Update version if not skipped
if [ "$UPDATE_VERSION" = true ]; then
  echo "###### 3. Updating version numbers..."
  update_version
else
  echo "###### 3. Skipping version update as requested..."
fi

# Build the web app
echo "###### 4. Building web application fast..."
npm run build:fast
echo "###### 4a. Building web application..."
npm run build

# Copy public directory contents to dist, excluding android directory (only needed for web dev server)
# Note: The android/ directory in public/ contains XML files for the webpack dev server
# The actual native Android app uses the XML files in the main android/ directory
echo "Copying public assets to dist (excluding android XML files)..."
rsync -av --exclude='android/' public/ dist/

# Für die mobile App verwenden wir nur den app-Unterordner als Root
# Das bedeutet, dass für die native App der "app"-Ordner der Hauptordner ist
echo "Konfiguriere native Apps, damit sie direkt die Web-App im app/-Unterordner laden..."

# Copy package.json to dist for version info
echo "Copying package.json to dist for version information..."
cp package.json dist/

# Sync with Capacitor
echo "###### 6. Syncing with Capacitor..."

# Copy content from dist/app/ to dist/ so Capacitor finds it in the right place dist/
# but without deleting the original app/ directory to maintain proper image paths
echo "Copying app/ contents to dist/ for Capacitor while preserving the app/ directory..."

# Copy everything from dist/app/ to dist/ directly (no need for temp directory)
cp -r dist/app/* dist/

# Ensure dist/app/ directory exists (it should, but let's be safe)
mkdir -p dist/app/

# Jetzt mit der Standardkonfiguration synchronisieren (webDir ist bereits auf 'dist' eingestellt)
echo "Synchronisiere mit Capacitor..."
npx cap sync

# Ensure only used images are copied to Android assets
echo "###### 7. Finding used images in the code..."

# create temp directory for used images
TEMP_IMG_DIR="temp_used_images"
rm -rf "$TEMP_IMG_DIR"
mkdir -p "$TEMP_IMG_DIR"

echo "###### 8. search for image references in code (HTML, CSS, JS files)"
find src -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) -exec grep -oE "['\"][^'\"]*\.(png|jpg|jpeg|gif|svg|webp)['\"]" {} \; | \
  tr -d "'\"" | sort | uniq > "$TEMP_IMG_DIR/used_images.txt"

echo "###### 9. Copying only used images to Android assets..."
mkdir -p android/app/src/main/assets/public/images

echo "Found images:"
cat "$TEMP_IMG_DIR/used_images.txt"

echo "###### 10. copy only used images"
while read -r img_path; do
  # remove ./ or / from path
  clean_path=${img_path#./}
  clean_path=${clean_path#/}
  
  # source path - für die App müssen wir die Bilder aus public/ verwenden
  src_path="public/$clean_path"
  
  # target directory - die assets müssen ins korrekte Verzeichnis auf Android
  # Wir kopieren sie direkt ins Wurzelverzeichnis von assets/
  target_dir="android/app/src/main/assets/$(dirname "$clean_path")"
  
  # only copy if file exists
  if [ -f "$src_path" ]; then
    mkdir -p "$target_dir"
    cp "$src_path" "$target_dir/"
    echo "Copied: $clean_path"
  else
    echo "Warning: Image not found: $src_path"
  fi
done < "$TEMP_IMG_DIR/used_images.txt"

# delete temp directory
rm -rf "$TEMP_IMG_DIR"

echo "Only used images copied successfully"

echo "###### 14. Build process completed"
echo "Platform: ${PLATFORM:-all}"

if [ -z "$PLATFORM" ] || [ "$PLATFORM" == "update" ]; then
  echo "Native apps updated with latest web code."
elif [ "$PLATFORM" == "android" ]; then
  echo "Android project built successfully."
  echo "To open in Android Studio, run: npx cap open android"
elif [ "$PLATFORM" == "ios" ]; then
  echo "iOS project built successfully."
  echo "To open in Xcode, run: npx cap open ios"
else
  echo "\nUsage: bash mobile-build.sh [platform]\n"
  echo "Available platforms:"
  echo "  android  - Build Android project"
  echo "  ios      - Build iOS project"
  echo "  update   - Only update native apps with latest web code"
fi

echo "Done!"
