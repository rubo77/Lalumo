# Mobile build script for Lalumo app using Capacitor
# This script builds the web app and syncs it with native platforms

# Dynamisch den Pfad zu Android Studio finden, unabhängig von der Snap-Version
find_android_studio() {
  # Versuche zuerst, den neuesten Snap-Pfad zu finden
  SNAP_STUDIO=$(find /snap/android-studio -name studio.sh -type f | sort -r | head -n 1 2>/dev/null)
  
  if [ -n "$SNAP_STUDIO" ] && [ -x "$SNAP_STUDIO" ]; then
    echo "$SNAP_STUDIO"
    return
  fi
  
  # Versuche andere übliche Installationsorte
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
  
  # Fallback: Versuche, den Befehl im PATH zu finden
  command -v studio.sh
}

# Setze den Pfad zu Android Studio
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
  
  # Extrahiere aktuelle Version aus package.json
  CURRENT_VERSION=$(grep -oP '"version":\s*"\K[^"]+' "$PACKAGE_FILE")
  
  if [ -z "$CURRENT_VERSION" ]; then
    echo "Error: Could not find version in package.json"
    return 1
  fi
  
  # Version in Major.Minor.Patch aufteilen
  MAJOR=$(echo "$CURRENT_VERSION" | cut -d. -f1)
  MINOR=$(echo "$CURRENT_VERSION" | cut -d. -f2)
  PATCH=$(echo "$CURRENT_VERSION" | cut -d. -f3)
  
  # Patch-Version erhöhen
  NEW_PATCH=$((PATCH + 1))
  NEW_VERSION="$MAJOR.$MINOR.$NEW_PATCH"
  
  echo "Updating version in package.json: $CURRENT_VERSION → $NEW_VERSION"
  
  # Version in package.json aktualisieren
  sed -i "s/\"version\":\s*\"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$PACKAGE_FILE"
  
  # package-lock.json mit aktualisierter Version synchronisieren
  echo "Updating package-lock.json..."
  npm install --package-lock-only --quiet
  
  # Version für Android vorbereiten (Format x.y oder x.y.z)
  if [ "$NEW_PATCH" -eq "0" ]; then
    ANDROID_VERSION="$MAJOR.$MINOR"
  else
    ANDROID_VERSION="$NEW_VERSION"
  fi
  
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
      
      # versionName mit neuer Version aus package.json synchronisieren
      echo "Updating Android versionName: $ANDROID_VERSION"
      sed -i "s/versionName \"[^\"]*\"/versionName \"$ANDROID_VERSION\"/" "$GRADLE_FILE"
    else
      echo "Could not find versionCode in $GRADLE_FILE"
    fi
  else
    echo "Android gradle file not found at $GRADLE_FILE"
  fi
}

# Version aktualisieren bei jedem Build
update_version

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

# Ensure images are copied to Android assets
echo "Copying images to Android assets..."
mkdir -p android/app/src/main/assets/public/images
cp -r public/images/* android/app/src/main/assets/public/images/
echo "Images copied successfully"

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
