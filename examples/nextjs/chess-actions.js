// app/actions/chess-actions.js
'use server';

import { getBestMove, getBestMoveWithEvaluation, isValidFEN } from '@/lib/stockfish-utils';

/**
 * Server action to get the best move for a given position
 * @param {string} fen - The FEN string representing the current board position
 * @param {Object} options - Optional configuration
 * @returns {Promise<{success: boolean, move?: string, error?: string}>}
 */
export async function getChessBestMove(fen, options = {}) {
  try {
    // Validate FEN string
    if (!isValidFEN(fen)) {
      return {
        success: false,
        error: 'Invalid FEN string provided'
      };
    }

    const move = await getBestMove(fen, {
      depth: Math.min(Math.max(options.depth || 15, 1), 20),
      timeLimit: Math.min(Math.max(options.timeLimit || 1000, 100), 30000),
      skillLevel: Math.min(Math.max(options.skillLevel || 20, 0), 20)
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
    if (!isValidFEN(fen)) {
      return {
        success: false,
        error: 'Invalid FEN string provided'
      };
    }

    const analysis = await getBestMoveWithEvaluation(fen, {
      depth: Math.min(Math.max(options.depth || 18, 1), 20),
      timeLimit: Math.min(Math.max(options.timeLimit || 2000, 100), 30000),
      skillLevel: Math.min(Math.max(options.skillLevel || 20, 0), 20)
    });

    return {
      success: true,
      analysis: {
        bestMove: analysis.move,
        evaluation: analysis.evaluation,
        depth: analysis.depth,
        evaluationText: getEvaluationText(analysis.evaluation),
        fen: fen
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
 * Server action to analyze multiple positions in parallel
 * @param {string[]} positions - Array of FEN strings
 * @param {Object} options - Optional configuration
 * @returns {Promise<{success: boolean, results?: Array, error?: string}>}
 */
export async function analyzeMultiplePositions(positions, options = {}) {
  try {
    if (!Array.isArray(positions) || positions.length === 0) {
      return {
        success: false,
        error: 'Invalid positions array provided'
      };
    }

    if (positions.length > 10) {
      return {
        success: false,
        error: 'Too many positions (maximum 10 allowed)'
      };
    }

    const results = await Promise.all(
      positions.map(async (fen, index) => {
        try {
          if (!isValidFEN(fen)) {
            return {
              index,
              fen,
              success: false,
              error: 'Invalid FEN string'
            };
          }

          const analysis = await getBestMoveWithEvaluation(fen, {
            depth: Math.min(Math.max(options.depth || 12, 1), 15), // Lower depth for batch
            timeLimit: Math.min(Math.max(options.timeLimit || 1000, 100), 5000),
            skillLevel: Math.min(Math.max(options.skillLevel || 20, 0), 20)
          });

          return {
            index,
            fen,
            success: true,
            analysis: {
              bestMove: analysis.move,
              evaluation: analysis.evaluation,
              depth: analysis.depth,
              evaluationText: getEvaluationText(analysis.evaluation)
            }
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
    console.error('Error analyzing multiple positions:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze positions'
    };
  }
}

/**
 * Server action for quick move validation and basic analysis
 * @param {string} fen - The FEN string representing the current board position
 * @param {string} move - The move to validate in algebraic notation
 * @returns {Promise<{success: boolean, analysis?: Object, error?: string}>}
 */
export async function validateMove(fen, move) {
  try {
    if (!isValidFEN(fen)) {
      return {
        success: false,
        error: 'Invalid FEN string provided'
      };
    }

    if (!move || typeof move !== 'string') {
      return {
        success: false,
        error: 'Invalid move provided'
      };
    }

    // Get the best move to compare against
    const bestMoveResult = await getBestMoveWithEvaluation(fen, {
      depth: 12,
      timeLimit: 1000
    });

    const isBestMove = bestMoveResult.move === move;
    
    return {
      success: true,
      analysis: {
        move: move,
        isBestMove: isBestMove,
        bestMove: bestMoveResult.move,
        evaluation: bestMoveResult.evaluation,
        evaluationText: getEvaluationText(bestMoveResult.evaluation),
        recommendation: isBestMove ? 'Excellent move!' : `Consider ${bestMoveResult.move} instead`
      }
    };
  } catch (error) {
    console.error('Error validating move:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate move'
    };
  }
}

/**
 * Helper function to convert numerical evaluation to human-readable text
 * @param {number} evaluation - The evaluation score
 * @returns {string} Human-readable evaluation text
 */
function getEvaluationText(evaluation) {
  if (evaluation === Infinity) return 'Mate for White';
  if (evaluation === -Infinity) return 'Mate for Black';
  if (evaluation > 5) return 'White has a decisive advantage';
  if (evaluation > 3) return 'White has a winning advantage';
  if (evaluation > 1.5) return 'White has a significant advantage';
  if (evaluation > 0.5) return 'White has a slight advantage';
  if (evaluation > -0.5) return 'Position is roughly equal';
  if (evaluation > -1.5) return 'Black has a slight advantage';
  if (evaluation > -3) return 'Black has a significant advantage';
  if (evaluation > -5) return 'Black has a winning advantage';
  return 'Black has a decisive advantage';
}

/**
 * Helper function to get evaluation color coding for UI
 * @param {number} evaluation - The evaluation score
 * @returns {string} Color code for UI styling
 */
export function getEvaluationColor(evaluation) {
  if (Math.abs(evaluation) === Infinity) return 'red';
  if (Math.abs(evaluation) > 3) return 'orange';
  if (Math.abs(evaluation) > 1) return 'yellow';
  return 'green';
}