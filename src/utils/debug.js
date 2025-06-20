/**
 * Debug utility for controlling console logs in different environments
 * Only shows console output when in debug mode
 */

// Debug flag - set to false in production
let isDebugMode = false;

// Production detection (Android, deployed web)
const isProduction = () => {
  // Check if we're running as an Android app
  const isAndroid = window.location.href.includes('android_asset') || 
                    window.location.protocol === 'file:' ||
                    document.URL.startsWith('file://') ||
                    document.URL.startsWith('capacitor://') ||
                    (window.Capacitor && window.Capacitor.isNative);
  
  // Check if we're on a deployed site (not localhost)
  const isDeployedWeb = !window.location.href.includes('localhost') && 
                        !window.location.href.includes('127.0.0.1') &&
                        window.location.protocol === 'https:';
                        
  return isAndroid || isDeployedWeb;
};

/**
 * Initialize the debug mode
 * @param {boolean} forceDebug - Force debug mode on regardless of environment
 */
const initDebugMode = (forceDebug = false) => {
  // Set debug mode on if forced or if not in production
  isDebugMode = forceDebug || !isProduction();
  
  // Log the debug status, using the native console.log directly
  const originalConsoleLog = console.log;
  originalConsoleLog(`Debug mode ${isDebugMode ? 'enabled' : 'disabled'} (${isProduction() ? 'production' : 'development'} environment detected)`);
  
  // Override console methods to filter by debug mode
  if (!isDebugMode) {
    // In production mode, disable all console output
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    // Keep error and warn for critical issues
    // But add a prefix to make it clear they're from the app
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError('LALUMO ERROR:', ...args);
    };
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      originalConsoleWarn('LALUMO WARNING:', ...args);
    };
  }
};

/**
 * Log a message only if in debug mode
 * @param {string|string[]} module - Module or component name, or array of module names/tags
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
const debugLog = (module, message, data) => {
  if (isDebugMode) {
    // Format the tag prefix based on whether module is a string or array
    let tagPrefix;
    
    if (Array.isArray(module)) {
      // If module is an array, join all tags with brackets
      tagPrefix = module.map(tag => `[${tag}]`).join(' ');
    } else {
      // If module is a string, use the original format
      tagPrefix = `[${module}]`;
    }
    
    // Log with the formatted tag prefix
    if (data) {
      console.log(`${tagPrefix} ${message}`, data);
    } else {
      console.log(`${tagPrefix} ${message}`);
    }
  }
};

// Make debugLog available globally for HTML templates
window.debugLog = debugLog;

/**
 * Enable debug mode manually (e.g., from console)
 */
const enableDebugMode = () => {
  // Store in session storage to persist page refreshes
  sessionStorage.setItem('lalumo_debug', 'true');
  window.location.reload();
};

/**
 * Disable debug mode manually
 */
const disableDebugMode = () => {
  // Remove from session storage
  sessionStorage.removeItem('lalumo_debug');
  window.location.reload();
};

// Check for debug flag in session storage or URL parameter
const checkStoredDebugSettings = () => {
  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const debugParam = urlParams.get('debug');
  
  // Check session storage
  const storedDebug = sessionStorage.getItem('lalumo_debug');
  
  // Initialize based on stored settings
  if (debugParam === 'true' || storedDebug === 'true') {
    initDebugMode(true);
    return true;
  }
  
  // Default initialization
  initDebugMode();
  return isDebugMode;
};

// Make debug functions available globally
window.lalumoDebug = {
  enable: enableDebugMode,
  disable: disableDebugMode,
  status: () => isDebugMode
};

export {
  initDebugMode,
  debugLog,
  enableDebugMode,
  disableDebugMode,
  checkStoredDebugSettings,
  isDebugMode
};
