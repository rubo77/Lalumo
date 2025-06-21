/**
 * Central configuration for Lalumo App
 * Contains environment-specific settings from central YAML config
 */

// Hardcode configuration for now until we resolve YAML loading issues
const configData = {
  development: {
    API_BASE_URL: 'http://localhost:8080',
    APP_BASE_URL: 'http://localhost:9091',
    APP_BASE_PATH: '/'
  },
  production: {
    API_BASE_URL: 'https://lalumo.eu/app',
    APP_BASE_URL: 'https://lalumo.eu/app',
    APP_BASE_PATH: '/app/'
  }
};

// Detect environment (local development vs production)
const isProduction = window.location.hostname === 'lalumo.eu' || 
                     window.location.hostname === 'lalumo.z11.de';

// Select config based on environment
const currentConfig = isProduction ? configData.production : configData.development;

// Debug log the detected environment
console.log(`[CONFIG] Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment`);
console.log(`[CONFIG] API_BASE_URL: ${currentConfig.API_BASE_URL}`);
console.log(`[CONFIG] APP_BASE_URL: ${currentConfig.APP_BASE_URL}`);
console.log(`[CONFIG] APP_BASE_PATH: ${currentConfig.APP_BASE_PATH}`);

export default currentConfig;
