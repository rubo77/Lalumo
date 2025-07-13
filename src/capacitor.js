/**
 * Capacitor integration for Lalumo app
 * This file handles initializing Capacitor plugins and native functionality
 */
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { cleanupAudioResources } from './components/audio-engine.js';

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

  // Add app lifecycle listeners to clean up audio resources
  if (typeof document !== 'undefined') {
    // Handle visibility change (when app goes to background/foreground)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        console.log('[LIFECYCLE] App going to background, cleaning up audio resources');
        cleanupAudioResources();
      }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      console.log('[LIFECYCLE] Page unloading, cleaning up audio resources');
      cleanupAudioResources();
    });
    
    // Handle focus events for web platform
    window.addEventListener('blur', () => {
      console.log('[LIFECYCLE] Window lost focus, cleaning up audio resources');
      cleanupAudioResources();
    });
  }

  return {
    isNative,
    getPlatform: () => Capacitor.getPlatform(),
  };
}
