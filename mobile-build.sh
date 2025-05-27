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

# Build the web app
echo "Building web application..."
npm run build

# Copy public directory contents to dist to ensure images are included
echo "Copying public assets to dist..."
cp -r public/* dist/

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
