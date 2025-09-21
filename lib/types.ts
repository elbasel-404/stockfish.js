/**
 * Stockfish.js TypeScript definitions
 * Modern async/await interface for the Stockfish chess engine
 */

export interface StockfishEngineOptions {
  /**
   * Path to the Stockfish WASM/JS file
   */
  enginePath?: string;
  /**
   * Maximum time to wait for engine initialization (ms)
   */
  initTimeout?: number;
  /**
   * Number of threads to use (1-32)
   */
  threads?: number;
  /**
   * Hash table size in MB (1-33554432)
   */
  hashSize?: number;
  /**
   * UCI engine options
   */
  options?: Record<string, string | number | boolean>;
}

export interface MoveInfo {
  /**
   * The best move in UCI notation (e.g., "e2e4")
   */
  move: string;
  /**
   * Move to ponder on (if available)
   */
  ponder?: string;
  /**
   * Evaluation score in centipawns
   */
  score?: number;
  /**
   * Search depth reached
   */
  depth?: number;
  /**
   * Nodes searched
   */
  nodes?: number;
  /**
   * Nodes per second
   */
  nps?: number;
  /**
   * Time taken in milliseconds
   */
  time?: number;
  /**
   * Principal variation (sequence of best moves)
   */
  pv?: string[];
  /**
   * Win-Draw-Loss probabilities
   */
  wdl?: {
    win: number;
    draw: number;
    loss: number;
  };
}

export interface SearchOptions {
  /**
   * Maximum search depth
   */
  depth?: number;
  /**
   * Maximum search time in milliseconds
   */
  time?: number;
  /**
   * Search only these moves (UCI notation)
   */
  searchMoves?: string[];
  /**
   * Number of principal variations to return
   */
  multiPV?: number;
  /**
   * Enable infinite search (must be stopped manually)
   */
  infinite?: boolean;
  /**
   * Maximum number of nodes to search
   */
  nodes?: number;
}

export interface EngineInfo {
  /**
   * Current search depth
   */
  depth: number;
  /**
   * Selective search depth
   */
  seldepth?: number;
  /**
   * Evaluation score in centipawns
   */
  score: number;
  /**
   * Nodes searched
   */
  nodes: number;
  /**
   * Nodes per second
   */
  nps: number;
  /**
   * Time elapsed in milliseconds
   */
  time: number;
  /**
   * Principal variation
   */
  pv: string[];
  /**
   * Hash table usage percentage
   */
  hashfull?: number;
  /**
   * Current move being searched
   */
  currmove?: string;
  /**
   * Current move number
   */
  currmovenumber?: number;
}

export interface Position {
  /**
   * FEN string representing the position
   */
  fen: string;
  /**
   * List of moves in UCI notation
   */
  moves?: string[];
  /**
   * Whether this is a Chess960 position
   */
  chess960?: boolean;
}

export interface EvaluationResult {
  /**
   * Static evaluation in centipawns
   */
  evaluation: number;
  /**
   * Detailed evaluation breakdown
   */
  details?: string;
}