// components/ChessAnalyzer.jsx
'use client';

import { useState, useTransition } from 'react';
import { useChessAnalysis } from '@/hooks/useChessAnalysis';

/**
 * Complete Chess Analysis Component
 * Demonstrates how to use Stockfish.js with Next.js Server Actions
 */
export default function ChessAnalyzer() {
  const [position, setPosition] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const [depth, setDepth] = useState(15);
  const [timeLimit, setTimeLimit] = useState(2000);
  const [skillLevel, setSkillLevel] = useState(20);
  const [isPending, startTransition] = useTransition();

  const {
    getBestMove,
    getAnalysis,
    analyzeMultiple,
    validateMoveAnalysis,
    isLoading,
    error,
    lastAnalysis,
    clearError,
    clearAnalysis
  } = useChessAnalysis();

  // Example positions for batch analysis
  const examplePositions = [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', // After e4
    'rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2', // After Nf6
    'rnbqkb1r/pppp1ppp/4pn2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3', // After e6
  ];

  const handleGetBestMove = async () => {
    clearError();
    startTransition(async () => {
      try {
        const move = await getBestMove(position, {
          depth,
          timeLimit,
          skillLevel
        });
        console.log('Best move:', move);
      } catch (error) {
        console.error('Failed to get best move:', error);
      }
    });
  };

  const handleGetAnalysis = async () => {
    clearError();
    startTransition(async () => {
      try {
        const analysis = await getAnalysis(position, {
          depth,
          timeLimit,
          skillLevel
        });
        console.log('Analysis:', analysis);
      } catch (error) {
        console.error('Failed to get analysis:', error);
      }
    });
  };

  const handleBatchAnalysis = async () => {
    clearError();
    startTransition(async () => {
      try {
        const results = await analyzeMultiple(examplePositions, {
          depth: Math.min(depth, 12), // Lower depth for batch
          timeLimit: Math.min(timeLimit, 1500),
          skillLevel
        });
        console.log('Batch analysis results:', results);
      } catch (error) {
        console.error('Failed to analyze positions:', error);
      }
    });
  };

  const handleValidateMove = async () => {
    const testMove = 'e2e4'; // Example move to validate
    clearError();
    startTransition(async () => {
      try {
        const validation = await validateMoveAnalysis(position, testMove);
        console.log('Move validation:', validation);
      } catch (error) {
        console.error('Failed to validate move:', error);
      }
    });
  };

  const isAnalyzing = isLoading || isPending;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Chess Position Analyzer
        </h1>
        
        {/* Position Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="fen" className="block text-sm font-medium text-gray-700 mb-2">
              FEN Position:
            </label>
            <textarea
              id="fen"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter FEN string here..."
            />
          </div>

          {/* Analysis Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="depth" className="block text-sm font-medium text-gray-700 mb-1">
                Search Depth: {depth}
              </label>
              <input
                id="depth"
                type="range"
                min="1"
                max="20"
                value={depth}
                onChange={(e) => setDepth(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit: {timeLimit}ms
              </label>
              <input
                id="timeLimit"
                type="range"
                min="500"
                max="10000"
                step="500"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            
            <div>
              <label htmlFor="skillLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Skill Level: {skillLevel}
              </label>
              <input
                id="skillLevel"
                type="range"
                min="0"
                max="20"
                value={skillLevel}
                onChange={(e) => setSkillLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button
            onClick={handleGetBestMove}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing...' : 'Get Best Move'}
          </button>
          
          <button
            onClick={handleGetAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing...' : 'Full Analysis'}
          </button>
          
          <button
            onClick={handleBatchAnalysis}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing...' : 'Batch Analysis'}
          </button>
          
          <button
            onClick={handleValidateMove}
            disabled={isAnalyzing}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? 'Analyzing...' : 'Validate e2e4'}
          </button>

          {(error || lastAnalysis) && (
            <button
              onClick={() => {
                clearError();
                clearAnalysis();
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {lastAnalysis && (
          <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Best Move:</span>
                  <span className="font-mono text-blue-600">{lastAnalysis.bestMove}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Evaluation:</span>
                  <span className={`font-mono ${getEvaluationColor(lastAnalysis.evaluation)}`}>
                    {formatEvaluation(lastAnalysis.evaluation)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium">Search Depth:</span>
                  <span>{lastAnalysis.depth}</span>
                </div>
              </div>
              
              <div>
                <span className="font-medium">Assessment:</span>
                <p className="mt-1 text-sm text-gray-600">{lastAnalysis.evaluationText}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isAnalyzing && (
          <div className="mt-6 flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Analyzing position...</span>
          </div>
        )}
      </div>

      {/* Example Positions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {examplePositions.map((fen, index) => (
            <button
              key={index}
              onClick={() => setPosition(fen)}
              className="p-3 text-left border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="font-mono text-sm text-gray-600 truncate">
                {fen}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getPositionName(index)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getEvaluationColor(evaluation) {
  if (Math.abs(evaluation) === Infinity) return 'text-red-600';
  if (Math.abs(evaluation) > 3) return 'text-orange-600';
  if (Math.abs(evaluation) > 1) return 'text-yellow-600';
  return 'text-green-600';
}

function formatEvaluation(evaluation) {
  if (evaluation === Infinity) return '+M';
  if (evaluation === -Infinity) return '-M';
  return evaluation > 0 ? `+${evaluation.toFixed(2)}` : evaluation.toFixed(2);
}

function getPositionName(index) {
  const names = [
    'Starting Position',
    'After 1.e4',
    'After 1.e4 Nf6',
    'After 1.e4 e6'
  ];
  return names[index] || `Position ${index + 1}`;
}