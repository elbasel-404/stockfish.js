// lib/stockfish-utils-simple.js
// Simplified version that works with the actual Stockfish.js module

/**
 * Creates a promise-based wrapper for getting the best move from Stockfish
 * This uses the npm stockfish package directly
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Configuration options
 * @param {number} options.depth - Search depth (default: 15)
 * @param {number} options.timeLimit - Time limit in milliseconds (default: 1000)
 * @param {number} options.skillLevel - Skill level 0-20 (default: 20)
 * @returns {Promise<string>} The best move in algebraic notation
 */
export function getBestMove(fen, options = {}) {
  return new Promise((resolve, reject) => {
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
    }, timeLimit + 5000);

    try {
      // Import stockfish dynamically to work in Server Actions
      import('stockfish').then(({ default: Stockfish }) => {
        engine = Stockfish();
        
        engine.onmessage = function(line) {
          if (typeof line !== "string") return;
          
          if (!gotUCI && line === "uciok") {
            gotUCI = true;
            engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
            engine.postMessage(`position fen ${fen}`);
            engine.postMessage(`go depth ${depth} movetime ${timeLimit}`);
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
              resolve(bestMove);
            } else {
              reject(new Error('No valid move found'));
            }
          }
        };

        engine.postMessage('uci');
      }).catch(error => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load Stockfish: ${error.message}`));
      });
      
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
  return new Promise((resolve, reject) => {
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
      import('stockfish').then(({ default: Stockfish }) => {
        engine = Stockfish();
        
        engine.onmessage = function(line) {
          if (typeof line !== "string") return;
          
          if (!gotUCI && line === "uciok") {
            gotUCI = true;
            engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
            engine.postMessage(`position fen ${fen}`);
            engine.postMessage(`go depth ${depth} movetime ${timeLimit}`);
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

        engine.postMessage('uci');
      }).catch(error => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load Stockfish: ${error.message}`));
      });
      
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
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