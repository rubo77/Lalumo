/**
 * Capacitor integration for Lalumo app
 * This file handles initializing Capacitor plugins and native functionality
 */
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

// Function to initialize Capacitor and its plugins
export function initCapacitor() {
  // Check if running on a native platform
  const isNative = Capacitor.isNativePlatform();
  console.log(`Running on ${isNative ? 'native' : 'web'} platform`);

  // Hide splash screen after app is ready
  if (isNative) {
    // Hide the splash screen with a fade animation
    SplashScreen.hide({
      fadeOutDuration: 500
    });
  }

  return {
    isNative,
    getPlatform: () => Capacitor.getPlatform(),
  };
}
