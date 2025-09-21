// hooks/useChessAnalysis.js
'use client';

import { useState, useCallback } from 'react';
import { 
  getChessBestMove, 
  getChessAnalysis, 
  analyzeMultiplePositions,
  validateMove 
} from '@/app/actions/chess-actions';

/**
 * Custom hook for chess analysis using Stockfish.js
 * Provides a clean interface for getting best moves and analysis
 */
export function useChessAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  /**
   * Get the best move for a position
   * @param {string} fen - FEN string of the position
   * @param {Object} options - Analysis options
   * @returns {Promise<string>} The best move
   */
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
      const errorMessage = err.message || 'Failed to get best move';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get detailed analysis for a position
   * @param {string} fen - FEN string of the position
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis object
   */
  const getAnalysis = useCallback(async (fen, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getChessAnalysis(fen, options);
      
      if (result.success) {
        setLastAnalysis(result.analysis);
        return result.analysis;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze position';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Analyze multiple positions
   * @param {string[]} positions - Array of FEN strings
   * @param {Object} options - Analysis options
   * @returns {Promise<Array>} Array of analysis results
   */
  const analyzeMultiple = useCallback(async (positions, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await analyzeMultiplePositions(positions, options);
      
      if (result.success) {
        return result.results;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze positions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate a move and get analysis
   * @param {string} fen - FEN string of the position
   * @param {string} move - Move to validate
   * @returns {Promise<Object>} Validation result
   */
  const validateMoveAnalysis = useCallback(async (fen, move) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await validateMove(fen, move);
      
      if (result.success) {
        return result.analysis;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to validate move';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear any errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear the last analysis
   */
  const clearAnalysis = useCallback(() => {
    setLastAnalysis(null);
  }, []);

  return {
    // Methods
    getBestMove,
    getAnalysis,
    analyzeMultiple,
    validateMoveAnalysis,
    clearError,
    clearAnalysis,
    
    // State
    isLoading,
    error,
    lastAnalysis,
    
    // Computed values
    hasError: !!error,
    isReady: !isLoading && !error
  };
}

/**
 * Hook for simplified best move functionality
 * Provides a more focused interface for just getting best moves
 */
export function useBestMove() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const getBestMove = useCallback(async (fen, options = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getChessBestMove(fen, options);
      
      if (result.success) {
        setLastMove({
          move: result.move,
          fen: fen,
          timestamp: Date.now()
        });
        return result.move;
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to get best move';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearState = useCallback(() => {
    setError(null);
    setLastMove(null);
  }, []);

  return {
    getBestMove,
    clearState,
    isLoading,
    error,
    lastMove,
    hasError: !!error
  };
}

/**
 * Hook for batch analysis functionality
 * Useful for analyzing multiple positions or game analysis
 */
export function useBatchAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);

  const analyzePositions = useCallback(async (positions, options = {}) => {
    if (!Array.isArray(positions) || positions.length === 0) {
      throw new Error('Invalid positions array');
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    try {
      // For large batches, process in chunks
      const chunkSize = 5;
      const chunks = [];
      
      for (let i = 0; i < positions.length; i += chunkSize) {
        chunks.push(positions.slice(i, i + chunkSize));
      }

      const allResults = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkResults = await analyzeMultiplePositions(chunk, options);
        
        if (chunkResults.success) {
          allResults.push(...chunkResults.results);
        } else {
          throw new Error(chunkResults.error);
        }
        
        setProgress((i + 1) / chunks.length);
        setResults([...allResults]); // Update results progressively
      }

      setResults(allResults);
      return allResults;
    } catch (err) {
      const errorMessage = err.message || 'Failed to analyze positions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      setProgress(1);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setProgress(0);
  }, []);

  return {
    analyzePositions,
    clearResults,
    isLoading,
    error,
    results,
    progress,
    hasError: !!error,
    isComplete: progress === 1 && !isLoading
  };
}