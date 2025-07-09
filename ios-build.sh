#!/bin/bash
# iOS build script for Lalumo app using Capacitor
# This script builds the web app and syncs it with iOS platform

# Default configuration
UPDATE_VERSION=false

# Show help information
show_help() {
  echo "\niOS Build Script for Lalumo\n"
  echo "Usage: bash ios-build.sh [options]\n"
  echo "Options:"
  echo "  -h, --help                Show this help message"
  echo "  -u, --update-version      Update version: extract current version from 'package."
  echo "                            json' and increment minor version, then update version"
  echo "                            in Info.plist"
  echo ""
  exit 0
}

# Process command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        ;;
      -u|--update-version)
        UPDATE_VERSION=true
        shift
        ;;
      *)
        echo "Unknown option: $1"
        show_help
        ;;
    esac
  done
}

# Update version in package.json and sync to Info.plist
update_version() {
  PACKAGE_FILE="package.json"
  INFO_PLIST_FILE="ios/App/App/Info.plist"
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
  
  echo "###### 1. Updating version in package.json: $CURRENT_VERSION → $NEW_VERSION"
  
  # update version in package.json
  sed -i "s/\"version\":\s*\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
  
  # update package-lock.json
  echo "Updating package-lock.json..."
  npm install --package-lock-only --quiet
  
  # iOS version format with 3 segments (major.minor.0)
  IOS_VERSION="$NEW_VERSION.0"
  
  echo "###### 1.1 Updating version in Info.plist"
  if [ -f "$INFO_PLIST_FILE" ]; then
    # Update CFBundleShortVersionString
    echo "New iOS version: $IOS_VERSION"
    plutil -replace CFBundleShortVersionString -string "$IOS_VERSION" "$INFO_PLIST_FILE"
    
    # Get current build number
    CURRENT_BUILD=$(plutil -extract CFBundleVersion xml1 -o - "$INFO_PLIST_FILE" | grep -oP '<string>\K[^<]+')
    
    if [ -n "$CURRENT_BUILD" ]; then
      # increment build number
      NEW_BUILD=$((CURRENT_BUILD + 1))
      echo "Updating iOS build number: $CURRENT_BUILD → $NEW_BUILD"
      plutil -replace CFBundleVersion -string "$NEW_BUILD" "$INFO_PLIST_FILE"
      
      # Update build number in package.json for web app
      echo "Injecting build number into package.json: $NEW_BUILD"
      # Check if buildNumber already exists
      if grep -q "buildNumber" "$PACKAGE_FILE"; then
        # Replace existing buildNumber
        sed -i "s/\"buildNumber\":\s*[0-9]*/\"buildNumber\": $NEW_BUILD/" "$PACKAGE_FILE"
      else
        # Add buildNumber after version
        sed -i "/"version":/a\  "buildNumber": $NEW_BUILD," "$PACKAGE_FILE"
      fi
    else
      echo "Could not find build number in $INFO_PLIST_FILE"
    fi
  else
    echo "iOS Info.plist file not found at $INFO_PLIST_FILE"
  fi
  
  # Update version in add_changelog.sh
  echo "###### 1.2 Updating version in dev/add_changelog.sh"
  if [ -f "$CHANGELOG_GENERATOR_FILE" ]; then
    echo "New version in changelog generator: $NEW_VERSION"
    # Replace the VERSION_NAME line in add_changelog.sh
    sed -i "s/VERSION_NAME=[0-9.]\+/VERSION_NAME=$NEW_VERSION/" "$CHANGELOG_GENERATOR_FILE"
  else
    echo "Changelog generator file not found at $CHANGELOG_GENERATOR_FILE"
  fi
}

# Parse command line arguments
parse_args "$@"

# Update version if requested
if [ "$UPDATE_VERSION" = true ]; then
  echo "###### 2. Updating version numbers..."
  update_version
else
  echo "###### 2. Skipping version update as requested..."
fi

# Build the web app
echo "###### 3. Building web application fast..."
npm run build:fast
echo "###### 3a. Building web application..."
npm run build

# Copy public directory contents to dist, excluding android directory
echo "###### 4. Copying public assets to dist..."
rsync -av --exclude='android/' public/ dist/

# Configure for mobile app to use the app subfolder as root
echo "###### 5. Configuring iOS app to load web app from app subfolder..."

# Copy package.json to dist for version info
echo "Copying package.json to dist for version information..."
cp package.json dist/

# Sync with Capacitor
echo "###### 6. Syncing with Capacitor..."

# Copy content from dist/app/ to dist/ for Capacitor while preserving the app/ directory
echo "Copying app/ contents to dist/ for Capacitor while preserving the app/ directory..."

# Copy everything from dist/app/ to dist/ directly (no need for temp directory)
cp -r dist/app/* dist/

# Ensure dist/app/ directory exists (it should, but let's be safe)
mkdir -p dist/app/

# Create our native-app-detector.js directly in both locations
echo "Creating native-app-detector.js for the app..."
cp src/native-app-detector.js dist/
cp src/native-app-detector.js dist/app/

# Sync with Capacitor (webDir is already set to 'dist' in config)
echo "Syncing with Capacitor..."
npx cap sync ios

# Ensure sound assets are properly copied
echo "###### 7. Ensuring sound assets are properly synced..."

# Check if sounds directory exists in dist
if [ -d "public/sounds" ]; then
  echo "Copying sound assets to iOS platform..."
  mkdir -p "ios/App/App/public/sounds"
  cp -r public/sounds/* ios/App/App/public/sounds/
  echo "Sound assets copied successfully to iOS platform"
else
  echo "No sounds directory found in public/"
fi

echo "###### 8. Opening iOS project in Xcode..."
npx cap open ios

echo "Done! iOS build process completed."
