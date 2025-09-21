/**
 * Modern TypeScript interface for Stockfish chess engine
 * Provides async/await API over the existing callback-based system
 */
import { EventEmitter } from 'events';
import { StockfishEngineOptions, MoveInfo, SearchOptions, Position, EvaluationResult } from './types.js';
export declare class StockfishEngine extends EventEmitter {
    private options;
    private engine;
    private isInitialized;
    private initPromise;
    private currentPosition;
    constructor(options?: StockfishEngineOptions);
    /**
     * Initialize the Stockfish engine
     */
    init(): Promise<void>;
    private _initialize;
    private _configureEngine;
    private _parseInfoLine;
    private _parseEngineInfo;
    /**
     * Set the current position
     */
    setPosition(position: Position): Promise<void>;
    /**
     * Get the best move for the current position
     */
    getAiMove(searchOptions?: SearchOptions): Promise<MoveInfo>;
    private _executeSearch;
    /**
     * Stop the current search
     */
    stop(): Promise<void>;
    /**
     * Get static evaluation of current position
     */
    evaluate(): Promise<EvaluationResult>;
    /**
     * Get current position as FEN string
     */
    getFen(): string;
    /**
     * Check if engine is ready
     */
    isReady(): boolean;
    /**
     * Quit and cleanup the engine
     */
    quit(): Promise<void>;
}
/**
 * Create and initialize a new Stockfish engine instance
 */
export declare function createEngine(options?: StockfishEngineOptions): Promise<StockfishEngine>;
/**
 * Simple convenience function to get AI move from a position
 */
export declare function getAiMove(fen: string, moves?: string[], searchOptions?: SearchOptions): Promise<MoveInfo>;
export * from './types.js';
export default StockfishEngine;
//# sourceMappingURL=stockfish.d.ts.map