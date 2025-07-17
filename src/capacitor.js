/**
 * Capacitor integration for Lalumo app
 * 
 * This file handles initializing Capacitor plugins and native functionality for both
 * mobile and web platforms. While Capacitor primarily bridges web code to native
 * mobile platforms (iOS/Android), this module also provides web-specific handling
 * for application lifecycle events.
 * 
 * For mobile: Initializes native plugins and handles platform-specific features
 * For web: Manages resource cleanup and lifecycle events (page visibility, unload)
 * 
 * Both environments import and use this module, which is why the lifecycle event 
 * handlers affect both mobile and web applications.
 */
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { cleanupAudioResources } from './components/audio-engine.js';
import { debugLog } from './utils/debug';

// Function to initialize Capacitor and its plugins
export function initCapacitor() {
  // Check if running on a native platform
  const isNative = Capacitor.isNativePlatform();
  debugLog('CAPACITOR', `Running on ${isNative ? 'native' : 'web'} platform`);

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
        debugLog('LIFECYCLE', 'App going to background, not cleaning up audio resources');
        //cleanupAudioResources();
      }
    });
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      debugLog('LIFECYCLE', 'Page unloading, cleaning up audio resources');
      cleanupAudioResources();
    });
    
    // Handle focus events for web platform
    window.addEventListener('blur', () => {
      console.log('[LIFECYCLE] Window lost focus, not cleaning up audio resources');
      // We don't want to clean up audio when user just clicks outside the window
      // cleanupAudioResources();
    });
  }

  return {
    isNative,
    getPlatform: () => Capacitor.getPlatform(),
  };
}
