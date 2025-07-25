import { debugLog } from './utils/debug';

/**
 * Central configuration for Lalumo App
 * Contains environment-specific settings from central YAML config
 */

// Hardcode configuration for now until we resolve YAML loading issues
const configData = {
  development: {
    API_BASE_URL: 'http://localhost:8080', // No /api prefix for local dev
    APP_BASE_URL: 'http://localhost:9091',
    APP_BASE_PATH: '/app/'
  },
  production: {
    API_BASE_URL: 'https://lalumo.eu/api',
    APP_BASE_URL: 'https://lalumo.eu',
    APP_BASE_PATH: '/app/'
  }
};

// Detect environment (local development vs production or mobile)
const isProduction = window.location.hostname === 'lalumo.eu' || 
                     window.location.hostname === 'lalumo.z11.de';

// Also consider as production when running in Capacitor/mobile environment
const isMobile = window.location.protocol === 'capacitor:' || 
               window.location.protocol === 'https:' && 
               (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const useProductionConfig = isProduction || isMobile;

// Check for configuration override from HTML
let configOverride = {};
if (isProduction && typeof window !== 'undefined' && window.LALUMO_CONFIG_OVERRIDE) {
  configOverride = window.LALUMO_CONFIG_OVERRIDE;
  debugLog('CONFIG', 'Using configuration override from HTML');
}

// Select config based on environment
let currentConfig = useProductionConfig ? configData.production : configData.development;

// Log if we're in mobile environment
if (isMobile) {
  debugLog('CONFIG', 'Running in MOBILE environment, using production API endpoints');
}

// Apply any overrides
currentConfig = { ...currentConfig, ...configOverride };

// Debug log the detected environment
debugLog('CONFIG', `Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`);
debugLog('CONFIG', `API_BASE_URL: ${currentConfig.API_BASE_URL}`);
debugLog('CONFIG', `APP_BASE_URL: ${currentConfig.APP_BASE_URL}`);
debugLog('CONFIG', `APP_BASE_PATH: ${currentConfig.APP_BASE_PATH}`);

export default currentConfig;
