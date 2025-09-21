// types/chess.ts
export interface ChessAnalysisOptions {
  /** Search depth (1-20) */
  depth?: number;
  /** Time limit in milliseconds */
  timeLimit?: number;
  /** Skill level (0-20) */
  skillLevel?: number;
}

export interface ChessAnalysis {
  /** Best move in algebraic notation */
  bestMove: string;
  /** Position evaluation in pawns (positive = white advantage) */
  evaluation: number;
  /** Search depth reached */
  depth: number;
  /** Human-readable evaluation text */
  evaluationText: string;
  /** FEN string of the analyzed position */
  fen: string;
}

export interface ChessActionResult<T = any> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Result data if successful */
  data?: T;
}

export interface BestMoveResult extends ChessActionResult {
  /** Best move in algebraic notation */
  move?: string;
}

export interface AnalysisResult extends ChessActionResult {
  /** Analysis details */
  analysis?: ChessAnalysis;
}

export interface MultipleAnalysisResult {
  /** Position index in the original array */
  index: number;
  /** FEN string of the position */
  fen: string;
  /** Whether analysis succeeded */
  success: boolean;
  /** Analysis result if successful */
  analysis?: ChessAnalysis;
  /** Error message if failed */
  error?: string;
}

export interface BatchAnalysisResult extends ChessActionResult {
  /** Array of analysis results */
  results?: MultipleAnalysisResult[];
}

export interface MoveValidation {
  /** The move that was validated */
  move: string;
  /** Whether this is the best move */
  isBestMove: boolean;
  /** The recommended best move */
  bestMove: string;
  /** Position evaluation */
  evaluation: number;
  /** Human-readable evaluation */
  evaluationText: string;
  /** Recommendation text */
  recommendation: string;
}

export interface MoveValidationResult extends ChessActionResult {
  /** Move validation details */
  analysis?: MoveValidation;
}

// Hook return types
export interface UseChessAnalysisReturn {
  // Methods
  getBestMove: (fen: string, options?: ChessAnalysisOptions) => Promise<string>;
  getAnalysis: (fen: string, options?: ChessAnalysisOptions) => Promise<ChessAnalysis>;
  analyzeMultiple: (positions: string[], options?: ChessAnalysisOptions) => Promise<MultipleAnalysisResult[]>;
  validateMoveAnalysis: (fen: string, move: string) => Promise<MoveValidation>;
  clearError: () => void;
  clearAnalysis: () => void;
  
  // State
  isLoading: boolean;
  error: string | null;
  lastAnalysis: ChessAnalysis | null;
  
  // Computed
  hasError: boolean;
  isReady: boolean;
}

export interface UseBestMoveReturn {
  getBestMove: (fen: string, options?: ChessAnalysisOptions) => Promise<string>;
  clearState: () => void;
  isLoading: boolean;
  error: string | null;
  lastMove: {
    move: string;
    fen: string;
    timestamp: number;
  } | null;
  hasError: boolean;
}

export interface UseBatchAnalysisReturn {
  analyzePositions: (positions: string[], options?: ChessAnalysisOptions) => Promise<MultipleAnalysisResult[]>;
  clearResults: () => void;
  isLoading: boolean;
  error: string | null;
  results: MultipleAnalysisResult[];
  progress: number;
  hasError: boolean;
  isComplete: boolean;
}

// Utility types
export type EvaluationColor = 'red' | 'orange' | 'yellow' | 'green';

export interface GameEvaluation {
  moveNumber: number;
  side: 'white' | 'black';
  move: string;
  evaluation?: number;
  bestMove?: string;
  fen?: string;
  error?: string;
}

export interface GameAnalysis {
  evaluations: GameEvaluation[];
  finalPosition: string;
  gameOver: boolean;
  result: '1-0' | '0-1' | '1/2-1/2' | '*' | null;
}

// Server action types (for reference)
export type GetChessBestMoveAction = (
  fen: string, 
  options?: ChessAnalysisOptions
) => Promise<BestMoveResult>;

export type GetChessAnalysisAction = (
  fen: string, 
  options?: ChessAnalysisOptions
) => Promise<AnalysisResult>;

export type AnalyzeMultiplePositionsAction = (
  positions: string[], 
  options?: ChessAnalysisOptions
) => Promise<BatchAnalysisResult>;

export type ValidateMoveAction = (
  fen: string, 
  move: string
) => Promise<MoveValidationResult>;