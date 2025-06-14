/**
 * common.js - Common functions for all chord activities
 */

// Import debug utilities
import { debugLog } from '../../utils/debug.js';

// Export a test function for import tests
export function testCommonModuleImport() {
  debugLog('CHORDS', 'Common module successfully imported');
  return true;
}
