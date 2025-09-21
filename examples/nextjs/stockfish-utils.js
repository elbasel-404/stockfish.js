// lib/stockfish-utils.js
const fs = require('fs');
const path = require('path');

/**
 * Creates and initializes a Stockfish engine instance
 * @returns {Promise<Object>} Initialized Stockfish engine
 */
async function createStockfishEngine() {
  const pathToEngine = path.join(__dirname, "..", "node_modules", "stockfish", "src", "stockfish.js");
  
  // Check if stockfish module exists, otherwise use relative path
  let enginePath;
  if (fs.existsSync(pathToEngine)) {
    enginePath = pathToEngine;
  } else {
    // Fallback to local installation or adjust path as needed
    throw new Error('Stockfish module not found. Please install with: npm install stockfish');
  }
  
  const ext = path.extname(enginePath);
  const basepath = enginePath.slice(0, -ext.length);
  const wasmPath = basepath + ".wasm";
  const basename = path.basename(basepath);
  const engineDir = path.dirname(enginePath);
  const buffers = [];
  
  const INIT_ENGINE = require(enginePath);
  
  const engine = {
    locateFile: function (filePath) {
      if (filePath.indexOf(".wasm") > -1) {
        if (filePath.indexOf(".wasm.map") > -1) {
          return wasmPath + ".map"
        }
        return wasmPath;
      } else {
        return enginePath;
      }
    },
  };
  
  // Manually assemble the WASM parts if they exist
  try {
    const files = fs.readdirSync(engineDir).sort();
    files.forEach(function (fileName) {
      if (fileName.startsWith(basename + "-part-") && fileName.endsWith(".wasm")) {
        buffers.push(fs.readFileSync(path.join(engineDir, fileName)));
      }
    });
    
    if (buffers.length) {
      engine.wasmBinary = Buffer.concat(buffers);
    }
  } catch (error) {
    // If we can't read WASM parts, continue without them
    console.warn('Could not load WASM parts, using single WASM file');
  }
  
  if (typeof INIT_ENGINE === "function") {
    const Stockfish = INIT_ENGINE();
    const stockfishEngine = await Stockfish(engine);
    
    // Set up the engine interface
    stockfishEngine.sendCommand = function (cmd) {
      setImmediate(function () {
        stockfishEngine.ccall("command", null, ["string"], [cmd], {async: /^go\b/.test(cmd)})
      });
    };
    
    return stockfishEngine;
  }
  
  throw new Error('Failed to initialize Stockfish engine');
}

/**
 * Creates a promise-based wrapper for getting the best move from Stockfish
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Configuration options
 * @param {number} options.depth - Search depth (default: 15)
 * @param {number} options.timeLimit - Time limit in milliseconds (default: 1000)
 * @param {number} options.skillLevel - Skill level 0-20 (default: 20)
 * @returns {Promise<string>} The best move in algebraic notation
 */
export function getBestMove(fen, options = {}) {
  return new Promise(async (resolve, reject) => {
    const {
      depth = 15,
      timeLimit = 1000,
      skillLevel = 20
    } = options;

    let engine;
    let bestMove = null;
    let gotUCI = false;
    
    const timeout = setTimeout(() => {
      if (engine && engine.terminate) {
        engine.terminate();
      }
      reject(new Error('Stockfish search timeout'));
    }, timeLimit + 5000); // Add 5s buffer

    try {
      engine = await createStockfishEngine();
      
      engine.listener = function(line) {
        if (typeof line !== "string") return;
        
        if (!gotUCI && line === "uciok") {
          gotUCI = true;
          // Engine is ready, configure it
          engine.sendCommand(`setoption name Skill Level value ${skillLevel}`);
          engine.sendCommand(`position fen ${fen}`);
          engine.sendCommand(`go depth ${depth} movetime ${timeLimit}`);
        } else if (line.startsWith('bestmove')) {
          // Extract the best move
          const moveMatch = line.match(/bestmove\s+(\S+)/);
          if (moveMatch && moveMatch[1] && moveMatch[1] !== '(none)') {
            bestMove = moveMatch[1];
          }
          
          clearTimeout(timeout);
          if (engine && engine.terminate) {
            engine.terminate();
          }
          
          if (bestMove) {
            resolve(bestMove);
          } else {
            reject(new Error('No valid move found'));
          }
        } else if (line.includes('info') && line.includes('depth')) {
          // Optional: You can extract evaluation info here if needed
          console.log('Search info:', line);
        }
      };

      // Initialize the engine
      engine.sendCommand('uci');
      
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * Gets the best move with evaluation score
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Configuration options
 * @returns {Promise<{move: string, evaluation: number, depth: number}>}
 */
export function getBestMoveWithEvaluation(fen, options = {}) {
  return new Promise(async (resolve, reject) => {
    const {
      depth = 15,
      timeLimit = 1000,
      skillLevel = 20
    } = options;

    let engine;
    let bestMove = null;
    let evaluation = null;
    let searchDepth = 0;
    let gotUCI = false;
    
    const timeout = setTimeout(() => {
      if (engine && engine.terminate) {
        engine.terminate();
      }
      reject(new Error('Stockfish search timeout'));
    }, timeLimit + 5000);

    try {
      engine = await createStockfishEngine();
      
      engine.listener = function(line) {
        if (typeof line !== "string") return;
        
        if (!gotUCI && line === "uciok") {
          gotUCI = true;
          engine.sendCommand(`setoption name Skill Level value ${skillLevel}`);
          engine.sendCommand(`position fen ${fen}`);
          engine.sendCommand(`go depth ${depth} movetime ${timeLimit}`);
        } else if (line.startsWith('info') && line.includes('depth')) {
          // Parse evaluation information
          const depthMatch = line.match(/depth\s+(\d+)/);
          const scoreMatch = line.match(/score\s+(cp|mate)\s+(-?\d+)/);
          const pvMatch = line.match(/pv\s+(\S+)/);
          
          if (depthMatch) {
            searchDepth = parseInt(depthMatch[1]);
          }
          
          if (scoreMatch && pvMatch) {
            bestMove = pvMatch[1];
            if (scoreMatch[1] === 'cp') {
              evaluation = parseInt(scoreMatch[2]) / 100; // Convert centipawns to pawns
            } else if (scoreMatch[1] === 'mate') {
              evaluation = scoreMatch[2][0] === '-' ? -Infinity : Infinity;
            }
          }
        } else if (line.startsWith('bestmove')) {
          const moveMatch = line.match(/bestmove\s+(\S+)/);
          if (moveMatch && moveMatch[1] && moveMatch[1] !== '(none)') {
            bestMove = moveMatch[1];
          }
          
          clearTimeout(timeout);
          if (engine && engine.terminate) {
            engine.terminate();
          }
          
          if (bestMove) {
            resolve({
              move: bestMove,
              evaluation: evaluation || 0,
              depth: searchDepth
            });
          } else {
            reject(new Error('No valid move found'));
          }
        }
      };

      engine.sendCommand('uci');
      
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * Simple in-memory cache for move calculations
 */
const moveCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Cached version of getBestMove
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} The best move in algebraic notation
 */
export function getCachedBestMove(fen, options = {}) {
  const cacheKey = `${fen}-${JSON.stringify(options)}`;
  
  if (moveCache.has(cacheKey)) {
    return Promise.resolve(moveCache.get(cacheKey));
  }
  
  return getBestMove(fen, options).then(move => {
    // Simple cache size management
    if (moveCache.size >= MAX_CACHE_SIZE) {
      const firstKey = moveCache.keys().next().value;
      moveCache.delete(firstKey);
    }
    
    moveCache.set(cacheKey, move);
    return move;
  });
}

/**
 * Validates a FEN string (basic validation)
 * @param {string} fen - The FEN string to validate
 * @returns {boolean} True if FEN appears valid
 */
export function isValidFEN(fen) {
  if (!fen || typeof fen !== 'string') return false;
  
  const parts = fen.trim().split(' ');
  if (parts.length !== 6) return false;
  
  // Basic piece placement validation
  const piecePlacement = parts[0];
  const ranks = piecePlacement.split('/');
  if (ranks.length !== 8) return false;
  
  // Check each rank
  for (const rank of ranks) {
    let squares = 0;
    for (const char of rank) {
      if ('12345678'.includes(char)) {
        squares += parseInt(char);
      } else if ('pnbrqkPNBRQK'.includes(char)) {
        squares += 1;
      } else {
        return false;
      }
    }
    if (squares !== 8) return false;
  }
  
  // Basic validation of other FEN parts
  const activeColor = parts[1];
  if (!['w', 'b'].includes(activeColor)) return false;
  
  const castling = parts[2];
  if (!/^(-|[KQkq]+)$/.test(castling)) return false;
  
  return true;
}