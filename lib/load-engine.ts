/**
 * ES Module wrapper for the loadEngine functionality
 * This provides an import-compatible interface to the existing loadEngine.js
 */

import * as path from 'path';

// Import the existing loadEngine as a CommonJS module
// This is the one remaining require() but it's isolated in this wrapper
const loadEngineCommonJS = require('../examples/loadEngine.js');

/**
 * Load and initialize a Stockfish engine instance
 * @param enginePath - Path to the engine executable/JS file
 * @param options - Engine loading options
 * @returns Engine instance with send/quit methods
 */
export function loadEngine(enginePath?: string, options?: any): any {
  return loadEngineCommonJS(enginePath, options);
}

/**
 * Get default engine path
 */
export function getDefaultEnginePath(): string {
  return path.join(__dirname, '..', 'src', 'stockfish.js');
}

export default loadEngine;