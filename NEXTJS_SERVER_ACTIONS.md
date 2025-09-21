# Using Stockfish.js with Next.js Server Actions

This guide explains how to use Stockfish.js with Next.js Server Actions to get the best move without relying on events, providing a pure function-based approach that takes the current board state and returns the best move.

## Table of Contents

- [Installation](#installation)
- [Basic Setup](#basic-setup)
- [Server Action Implementation](#server-action-implementation)
- [Client-Side Integration](#client-side-integration)
- [Advanced Usage](#advanced-usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

## Installation

```bash
npm install stockfish
```

## Basic Setup

### 1. Create a Stockfish Utility

First, create a utility module to handle the Stockfish engine:

```javascript
// lib/stockfish-utils.js
const stockfish = require('stockfish');

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
  return new Promise((resolve, reject) => {
    const {
      depth = 15,
      timeLimit = 1000,
      skillLevel = 20
    } = options;

    let engine;
    let bestMove = null;
    let isSearching = false;
    const timeout = setTimeout(() => {
      if (engine && engine.terminate) {
        engine.terminate();
      }
      reject(new Error('Stockfish search timeout'));
    }, timeLimit + 5000); // Add 5s buffer

    try {
      engine = stockfish();
      
      engine.onmessage = function(event) {
        const message = event;
        
        if (message === 'uciok') {
          // Engine is ready, configure it
          engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
          engine.postMessage(`position fen ${fen}`);
          engine.postMessage(`go depth ${depth} movetime ${timeLimit}`);
          isSearching = true;
        } else if (message.startsWith('bestmove')) {
          // Extract the best move
          const moveMatch = message.match(/bestmove\s+(\S+)/);
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
        } else if (message.includes('info') && message.includes('depth')) {
          // Optional: You can extract evaluation info here if needed
          console.log('Search info:', message);
        }
      };

      // Initialize the engine
      engine.postMessage('uci');
      
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
    const timeout = setTimeout(() => {
      if (engine && engine.terminate) {
        engine.terminate();
      }
      reject(new Error('Stockfish search timeout'));
    }, timeLimit + 5000);

    try {
      engine = stockfish();
      
      engine.onmessage = function(event) {
        const message = event;
        
        if (message === 'uciok') {
          engine.postMessage(`setoption name Skill Level value ${skillLevel}`);
          engine.postMessage(`position fen ${fen}`);
          engine.postMessage(`go depth ${depth} movetime ${timeLimit}`);
        } else if (message.startsWith('info') && message.includes('depth')) {
          // Parse evaluation information
          const depthMatch = message.match(/depth\s+(\d+)/);
          const scoreMatch = message.match(/score\s+(cp|mate)\s+(-?\d+)/);
          const pvMatch = message.match(/pv\s+(\S+)/);
          
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
        } else if (message.startsWith('bestmove')) {
          const moveMatch = message.match(/bestmove\s+(\S+)/);
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
      
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}
```

## Server Action Implementation

### 2. Create the Server Action

```javascript
// app/actions/chess-actions.js
'use server';

import { getBestMove, getBestMoveWithEvaluation } from '@/lib/stockfish-utils';

/**
 * Server action to get the best move for a given position
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Optional configuration
 * @returns {Promise<{success: boolean, move?: string, error?: string}>}
 */
export async function getChessBestMove(fen, options = {}) {
  try {
    // Validate FEN string (basic validation)
    if (!fen || typeof fen !== 'string') {
      return {
        success: false,
        error: 'Invalid FEN string provided'
      };
    }

    const move = await getBestMove(fen, {
      depth: options.depth || 15,
      timeLimit: options.timeLimit || 1000,
      skillLevel: options.skillLevel || 20
    });

    return {
      success: true,
      move: move
    };
  } catch (error) {
    console.error('Error getting best move:', error);
    return {
      success: false,
      error: error.message || 'Failed to get best move'
    };
  }
}

/**
 * Server action to get the best move with detailed analysis
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Optional configuration
 * @returns {Promise<{success: boolean, analysis?: Object, error?: string}>}
 */
export async function getChessAnalysis(fen, options = {}) {
  try {
    if (!fen || typeof fen !== 'string') {
      return {
        success: false,
        error: 'Invalid FEN string provided'
      };
    }

    const analysis = await getBestMoveWithEvaluation(fen, {
      depth: options.depth || 18,
      timeLimit: options.timeLimit || 2000,
      skillLevel: options.skillLevel || 20
    });

    return {
      success: true,
      analysis: {
        bestMove: analysis.move,
        evaluation: analysis.evaluation,
        depth: analysis.depth,
        evaluationText: getEvaluationText(analysis.evaluation)
      }
    };
  } catch (error) {
    console.error('Error getting chess analysis:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze position'
    };
  }
}

/**
 * Helper function to convert numerical evaluation to human-readable text
 */
function getEvaluationText(evaluation) {
  if (evaluation === Infinity) return 'Mate for White';
  if (evaluation === -Infinity) return 'Mate for Black';
  if (evaluation > 3) return 'White has a winning advantage';
  if (evaluation > 1) return 'White has a significant advantage';
  if (evaluation > 0.5) return 'White has a slight advantage';
  if (evaluation > -0.5) return 'Position is roughly equal';
  if (evaluation > -1) return 'Black has a slight advantage';
  if (evaluation > -3) return 'Black has a significant advantage';
  return 'Black has a winning advantage';
}
```

## Client-Side Integration

### 3. Use the Server Action in Your Component

```javascript
// components/ChessBoard.js
'use client';

import { useState, useTransition } from 'react';
import { getChessBestMove, getChessAnalysis } from '@/app/actions/chess-actions';

export default function ChessBoard() {
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [bestMove, setBestMove] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleGetBestMove = async () => {
    setIsCalculating(true);
    startTransition(async () => {
      try {
        const result = await getChessBestMove(position, {
          depth: 15,
          timeLimit: 2000
        });
        
        if (result.success) {
          setBestMove(result.move);
        } else {
          console.error('Error:', result.error);
          setBestMove('Error getting move');
        }
      } catch (error) {
        console.error('Failed to get best move:', error);
        setBestMove('Error getting move');
      } finally {
        setIsCalculating(false);
      }
    });
  };

  const handleGetAnalysis = async () => {
    setIsCalculating(true);
    startTransition(async () => {
      try {
        const result = await getChessAnalysis(position, {
          depth: 18,
          timeLimit: 3000
        });
        
        if (result.success) {
          setAnalysis(result.analysis);
          setBestMove(result.analysis.bestMove);
        } else {
          console.error('Error:', result.error);
          setAnalysis(null);
        }
      } catch (error) {
        console.error('Failed to get analysis:', error);
        setAnalysis(null);
      } finally {
        setIsCalculating(false);
      }
    });
  };

  return (
    <div className="chess-board-container">
      <div className="position-input">
        <label htmlFor="fen">FEN Position:</label>
        <textarea
          id="fen"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          rows={3}
          cols={60}
          placeholder="Enter FEN string here..."
        />
      </div>
      
      <div className="controls">
        <button 
          onClick={handleGetBestMove}
          disabled={isCalculating || isPending}
        >
          {isCalculating ? 'Calculating...' : 'Get Best Move'}
        </button>
        
        <button 
          onClick={handleGetAnalysis}
          disabled={isCalculating || isPending}
        >
          {isCalculating ? 'Analyzing...' : 'Get Full Analysis'}
        </button>
      </div>

      <div className="results">
        {bestMove && (
          <div className="best-move">
            <h3>Best Move: {bestMove}</h3>
          </div>
        )}
        
        {analysis && (
          <div className="analysis">
            <h3>Position Analysis</h3>
            <p><strong>Best Move:</strong> {analysis.bestMove}</p>
            <p><strong>Evaluation:</strong> {analysis.evaluation.toFixed(2)}</p>
            <p><strong>Search Depth:</strong> {analysis.depth}</p>
            <p><strong>Assessment:</strong> {analysis.evaluationText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. Simple Hook for Chess Analysis

```javascript
// hooks/useChessAnalysis.js
'use client';

import { useState, useCallback } from 'react';
import { getChessBestMove, getChessAnalysis } from '@/app/actions/chess-actions';

export function useChessAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getBestMove = useCallback(async (fen, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getChessBestMove(fen, options);
      
      if (result.success) {
        return result.move;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getAnalysis = useCallback(async (fen, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getChessAnalysis(fen, options);
      
      if (result.success) {
        return result.analysis;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getBestMove,
    getAnalysis,
    isLoading,
    error
  };
}
```

## Advanced Usage

### Multiple Position Analysis

```javascript
// app/actions/chess-actions.js (additional action)
'use server';

export async function analyzeMultiplePositions(positions, options = {}) {
  try {
    const results = await Promise.all(
      positions.map(async (fen, index) => {
        try {
          const analysis = await getBestMoveWithEvaluation(fen, options);
          return {
            index,
            fen,
            success: true,
            analysis
          };
        } catch (error) {
          return {
            index,
            fen,
            success: false,
            error: error.message
          };
        }
      })
    );

    return {
      success: true,
      results
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### Game Position Evaluation

```javascript
// lib/chess-game-utils.js
import { getBestMoveWithEvaluation } from './stockfish-utils';

/**
 * Evaluates a complete game from PGN moves
 * @param {string[]} moves - Array of moves in algebraic notation
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Game analysis with move evaluations
 */
export async function evaluateGame(moves, options = {}) {
  const Chess = require('chess.js').Chess;
  const game = new Chess();
  const evaluations = [];
  
  // Play through each move and evaluate
  for (let i = 0; i < moves.length; i++) {
    try {
      game.move(moves[i]);
      const fen = game.fen();
      
      const analysis = await getBestMoveWithEvaluation(fen, {
        depth: options.depth || 12,
        timeLimit: options.timeLimit || 1000
      });
      
      evaluations.push({
        moveNumber: Math.floor(i / 2) + 1,
        side: i % 2 === 0 ? 'white' : 'black',
        move: moves[i],
        evaluation: analysis.evaluation,
        bestMove: analysis.move,
        fen: fen
      });
      
    } catch (error) {
      console.error(`Error evaluating move ${i + 1}:`, error);
      evaluations.push({
        moveNumber: Math.floor(i / 2) + 1,
        side: i % 2 === 0 ? 'white' : 'black',
        move: moves[i],
        error: error.message
      });
    }
  }
  
  return {
    evaluations,
    finalPosition: game.fen(),
    gameOver: game.isGameOver(),
    result: game.isGameOver() ? getGameResult(game) : null
  };
  
  function getGameResult(game) {
    if (game.isCheckmate()) {
      return game.turn() === 'w' ? '0-1' : '1-0';
    } else if (game.isDraw()) {
      return '1/2-1/2';
    }
    return '*';
  }
}
```

## API Reference

### getBestMove(fen, options)

Returns the best move for a given position.

**Parameters:**
- `fen` (string): FEN notation of the position
- `options` (object): Configuration options
  - `depth` (number): Search depth (1-20, default: 15)
  - `timeLimit` (number): Time limit in milliseconds (default: 1000)
  - `skillLevel` (number): Skill level 0-20 (default: 20)

**Returns:** Promise<string> - Best move in algebraic notation

### getBestMoveWithEvaluation(fen, options)

Returns the best move with evaluation details.

**Parameters:** Same as getBestMove

**Returns:** Promise<Object>
- `move` (string): Best move in algebraic notation
- `evaluation` (number): Position evaluation in pawns
- `depth` (number): Search depth reached

### Server Actions

#### getChessBestMove(fen, options)

Server action wrapper for getBestMove.

**Returns:** Promise<Object>
- `success` (boolean): Whether the operation succeeded
- `move` (string): Best move if successful
- `error` (string): Error message if failed

#### getChessAnalysis(fen, options)

Server action wrapper for getBestMoveWithEvaluation.

**Returns:** Promise<Object>
- `success` (boolean): Whether the operation succeeded
- `analysis` (object): Analysis details if successful
- `error` (string): Error message if failed

## Troubleshooting

### Common Issues

1. **Memory Issues with Large Depth:**
   - Limit search depth to 18 or below
   - Use shorter time limits for quick responses

2. **Timeout Errors:**
   - Increase the timeLimit option
   - Reduce search depth for faster results

3. **Invalid FEN Errors:**
   - Validate FEN strings before passing to the engine
   - Use a chess library like chess.js for validation

4. **Engine Not Terminating:**
   - Always call engine.terminate() in error handlers
   - Use timeouts to prevent hanging requests

### Performance Tips

1. **Caching Results:**
   ```javascript
   // Simple in-memory cache
   const moveCache = new Map();
   
   export function getCachedBestMove(fen, options) {
     const cacheKey = `${fen}-${JSON.stringify(options)}`;
     
     if (moveCache.has(cacheKey)) {
       return Promise.resolve(moveCache.get(cacheKey));
     }
     
     return getBestMove(fen, options).then(move => {
       moveCache.set(cacheKey, move);
       return move;
     });
   }
   ```

2. **Batch Processing:**
   - Use Promise.all() for parallel analysis of multiple positions
   - Limit concurrent requests to prevent memory issues

3. **Optimized Settings:**
   - Use depth 12-15 for interactive applications
   - Use depth 18+ for detailed analysis
   - Adjust skill level based on intended difficulty

This approach provides a clean, server-side solution for chess analysis without relying on client-side events, making it perfect for Next.js Server Actions.