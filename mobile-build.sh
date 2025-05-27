# Mobile build script for Lalumo app using Capacitor
# This script builds the web app and syncs it with native platforms

# Build the web app
echo "Building web application..."
npm run build

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

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
