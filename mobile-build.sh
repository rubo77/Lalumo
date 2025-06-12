#!/bin/bash
# Mobile build script for Lalumo app using Capacitor
# This script builds the web app and syncs it with native platforms

# Default configuration
SKIP_VERSION_UPDATE=false

# Show help information
show_help() {
  echo "\nLalumo Mobile Build Script\n"
  echo "Usage: bash mobile-build.sh [options] [platform]\n"
  echo "Options:"
  echo "  -h, --help                Show this help message"
  echo "  -n, --no-version-update   Skip version update"
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
      -n|--no-version-update)
        SKIP_VERSION_UPDATE=true
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

# find path to Android Studio dynamically, independent of snap version
find_android_studio() {
  # try to find latest snap path
  SNAP_STUDIO=$(find /snap/android-studio -name studio.sh -type f | sort -r | head -n 1 2>/dev/null)
  
  if [ -n "$SNAP_STUDIO" ] && [ -x "$SNAP_STUDIO" ]; then
    echo "$SNAP_STUDIO"
    return
  fi
  
  # try other common installation paths
  for path in \
    "/usr/local/android-studio/bin/studio.sh" \
    "$HOME/android-studio/bin/studio.sh" \
    "/opt/android-studio/bin/studio.sh"
  do
    if [ -x "$path" ]; then
      echo "$path"
      return
    fi
  done
  
  # fallback: try to find studio.sh in PATH
  command -v studio.sh
}

# set path to Android Studio
STUDIO_PATH=$(find_android_studio)

if [ -n "$STUDIO_PATH" ]; then
  echo "Android Studio gefunden unter: $STUDIO_PATH"
  export CAPACITOR_ANDROID_STUDIO_PATH="$STUDIO_PATH"
else
  echo "Warnung: Android Studio nicht gefunden. Das Öffnen des Android-Projekts könnte fehlschlagen."
fi

# Update version in package.json and sync to build.gradle
update_version() {
  PACKAGE_FILE="package.json"
  GRADLE_FILE="android/app/build.gradle"
  
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
  
  # increment minor version (no patch version)
  NEW_MINOR=$((MINOR + 1))
  NEW_VERSION="$MAJOR.$NEW_MINOR"
  
  echo "Updating version in package.json: $CURRENT_VERSION → $NEW_VERSION"
  
  # update version in package.json
  sed -i "s/\"version\":\s*\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
  
  # update package-lock.json
  echo "Updating package-lock.json..."
  npm install --package-lock-only --quiet
  
  # Version für Android verwenden (immer nur Major.Minor Format)
  ANDROID_VERSION="$NEW_VERSION"
  
  # Version in build.gradle aktualisieren
  if [ -f "$GRADLE_FILE" ]; then
    # Extrahiere aktuelle versionCode
    CURRENT_CODE=$(grep -oP 'versionCode\s+\K\d+' "$GRADLE_FILE")
    
    if [ -n "$CURRENT_CODE" ]; then
      # versionCode inkrementieren
      NEW_CODE=$((CURRENT_CODE + 1))
      echo "Updating Android versionCode: $CURRENT_CODE → $NEW_CODE"
      
      # versionCode in gradle file ersetzen
      sed -i "s/versionCode $CURRENT_CODE/versionCode $NEW_CODE/" "$GRADLE_FILE"
      
      # versionName with new version from package.json
      echo "Updating Android versionName: $ANDROID_VERSION"
      sed -i "s/versionName \"[^\"]*\"/versionName \"$ANDROID_VERSION\"/" "$GRADLE_FILE"
    else
      echo "Could not find versionCode in $GRADLE_FILE"
    fi
  else
    echo "Android gradle file not found at $GRADLE_FILE"
  fi
}

# Parse command line arguments
parse_args "$@"

# Update version if not skipped
if [ "$SKIP_VERSION_UPDATE" = false ]; then
  echo "Updating version numbers..."
  update_version
else
  echo "Skipping version update as requested..."
fi

# Build the web app
echo "Building web application..."
npm run build

# Copy public directory contents to dist, excluding android directory (only needed for web dev server)
# Note: The android/ directory in public/ contains XML files for the webpack dev server
# The actual native Android app uses the XML files in the main android/ directory
echo "Copying public assets to dist (excluding android XML files)..."
rsync -av --exclude='android/' public/ dist/

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

# Ensure only used images are copied to Android assets
echo "Finding used images in the code..."

# create temp directory for used images
TEMP_IMG_DIR="temp_used_images"
rm -rf "$TEMP_IMG_DIR"
mkdir -p "$TEMP_IMG_DIR"

# search for image references in code (HTML, CSS, JS files)
find src -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) -exec grep -oE "['\"][^'\"]*\.(png|jpg|jpeg|gif|svg|webp)['\"]" {} \; | \
  tr -d "'\"" | sort | uniq > "$TEMP_IMG_DIR/used_images.txt"

echo "Copying only used images to Android assets..."
mkdir -p android/app/src/main/assets/public/images

echo "Found images:"
cat "$TEMP_IMG_DIR/used_images.txt"

# copy only used images
while read -r img_path; do
  # remove ./ or / from path
  clean_path=${img_path#./}
  clean_path=${clean_path#/}
  
  # source path
  src_path="public/$clean_path"
  
  # target directory
  target_dir="android/app/src/main/assets/public/$(dirname "$clean_path")"
  
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

# Platform-specific commands
if [ "$1" == "android" ]; then
  echo "Opening Android project in Android Studio..."
  npx cap open android
elif [ "$1" == "ios" ]; then
  echo "Opening iOS project in Xcode..."
  npx cap open ios
elif [ "$1" == "update" ]; then
  echo "Just updating native apps with latest web code."
else
  echo "\nUsage: bash mobile-build.sh [platform]\n"
  echo "Available platforms:"
  echo "  android  - Build and open Android project"
  echo "  ios      - Build and open iOS project"
  echo "  update   - Only update native apps with latest web code"
fi

echo "Done!"
