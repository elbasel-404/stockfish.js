/**
 * Modern TypeScript interface for Stockfish chess engine
 * Provides async/await API over the existing callback-based system
 */
import { EventEmitter } from 'events';
import * as path from 'path';
import { 
  StockfishEngineOptions, 
  MoveInfo, 
  SearchOptions, 
  EngineInfo, 
  Position, 
  EvaluationResult 
} from './types';

// Import the existing loadEngine function
const loadEngine = require('../examples/loadEngine.js');

export class StockfishEngine extends EventEmitter {
  private engine: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private currentPosition: Position = { fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' };
  
  constructor(private options: StockfishEngineOptions = {}) {
    super();
    
    // Set default options
    this.options = {
      initTimeout: 10000,
      threads: 1,
      hashSize: 16,
      ...options
    };
  }

  /**
   * Initialize the Stockfish engine
   */
  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this._initialize();
    return this.initPromise;
  }

  private async _initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Engine initialization timeout after ${this.options.initTimeout}ms`));
      }, this.options.initTimeout);

      try {
        // Determine engine path
        const enginePath = this.options.enginePath || 
          path.join(__dirname, '..', 'src', 'stockfish.js');
        
        // Load the engine
        this.engine = loadEngine(enginePath);
        
        // Set up stream handler for real-time info
        this.engine.stream = (line: string) => {
          this.emit('data', line);
          this._parseInfoLine(line);
        };

        // Wait for engine to be ready
        this.engine.send('uci', () => {
          this.engine.send('isready', async () => {
            try {
              // Configure engine options
              await this._configureEngine();
              
              clearTimeout(timeout);
              this.isInitialized = true;
              this.emit('ready');
              resolve();
            } catch (error) {
              clearTimeout(timeout);
              reject(error);
            }
          });
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private async _configureEngine(): Promise<void> {
    return new Promise((resolve) => {
      let pendingCommands = 0;
      const onComplete = () => {
        pendingCommands--;
        if (pendingCommands === 0) {
          resolve();
        }
      };

      // Set threads
      if (this.options.threads && this.options.threads !== 1) {
        pendingCommands++;
        this.engine.send(`setoption name Threads value ${this.options.threads}`, onComplete);
      }

      // Set hash size
      if (this.options.hashSize && this.options.hashSize !== 16) {
        pendingCommands++;
        this.engine.send(`setoption name Hash value ${this.options.hashSize}`, onComplete);
      }

      // Set custom options
      if (this.options.options) {
        for (const [name, value] of Object.entries(this.options.options)) {
          pendingCommands++;
          this.engine.send(`setoption name ${name} value ${value}`, onComplete);
        }
      }

      // If no commands were sent, resolve immediately
      if (pendingCommands === 0) {
        resolve();
      }
    });
  }

  private _parseInfoLine(line: string): void {
    if (line.startsWith('info ')) {
      const info = this._parseEngineInfo(line);
      if (info) {
        this.emit('info', info);
      }
    }
  }

  private _parseEngineInfo(line: string): EngineInfo | null {
    const parts = line.split(' ');
    const info: Partial<EngineInfo> = {};
    
    for (let i = 1; i < parts.length; i++) {
      const key = parts[i];
      const value = parts[i + 1];
      
      switch (key) {
        case 'depth':
          info.depth = parseInt(value);
          i++;
          break;
        case 'seldepth':
          info.seldepth = parseInt(value);
          i++;
          break;
        case 'score':
          const scoreType = parts[i + 1];
          const scoreValue = parseInt(parts[i + 2]);
          if (scoreType === 'cp') {
            info.score = scoreValue;
          } else if (scoreType === 'mate') {
            info.score = scoreValue > 0 ? 10000 - scoreValue : -10000 - scoreValue;
          }
          i += 2;
          break;
        case 'nodes':
          info.nodes = parseInt(value);
          i++;
          break;
        case 'nps':
          info.nps = parseInt(value);
          i++;
          break;
        case 'time':
          info.time = parseInt(value);
          i++;
          break;
        case 'pv':
          info.pv = parts.slice(i + 1);
          i = parts.length; // End of line
          break;
        case 'hashfull':
          info.hashfull = parseInt(value);
          i++;
          break;
        case 'currmove':
          info.currmove = value;
          i++;
          break;
        case 'currmovenumber':
          info.currmovenumber = parseInt(value);
          i++;
          break;
      }
    }
    
    return info.depth !== undefined ? info as EngineInfo : null;
  }

  /**
   * Set the current position
   */
  async setPosition(position: Position): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      this.currentPosition = position;
      
      let positionCommand = 'position ';
      if (position.fen === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
        positionCommand += 'startpos';
      } else {
        positionCommand += `fen ${position.fen}`;
      }
      
      if (position.moves && position.moves.length > 0) {
        positionCommand += ` moves ${position.moves.join(' ')}`;
      }
      
      this.engine.send(positionCommand, () => {
        resolve();
      });
    });
  }

  /**
   * Get the best move for the current position
   */
  async getAiMove(searchOptions: SearchOptions = {}): Promise<MoveInfo> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      let goCommand = 'go';
      
      if (searchOptions.depth) {
        goCommand += ` depth ${searchOptions.depth}`;
      }
      if (searchOptions.time) {
        goCommand += ` movetime ${searchOptions.time}`;
      }
      if (searchOptions.nodes) {
        goCommand += ` nodes ${searchOptions.nodes}`;
      }
      if (searchOptions.infinite) {
        goCommand += ' infinite';
      }
      if (searchOptions.searchMoves && searchOptions.searchMoves.length > 0) {
        goCommand += ` searchmoves ${searchOptions.searchMoves.join(' ')}`;
      }
      
      // Set MultiPV if specified
      if (searchOptions.multiPV && searchOptions.multiPV > 1) {
        this.engine.send(`setoption name MultiPV value ${searchOptions.multiPV}`, () => {
          this._executeSearch(goCommand, resolve, reject);
        });
      } else {
        this._executeSearch(goCommand, resolve, reject);
      }
    });
  }

  private _executeSearch(goCommand: string, resolve: (value: MoveInfo) => void, reject: (reason: any) => void): void {
    let lastInfo: EngineInfo | null = null;
    
    // Store the current info handler
    const originalInfoHandler = this.listeners('info');
    
    // Add our temporary info handler
    const infoHandler = (info: EngineInfo) => {
      lastInfo = info;
    };
    this.on('info', infoHandler);
    
    this.engine.send(goCommand, (result: string) => {
      // Remove our temporary handler
      this.removeListener('info', infoHandler);
      
      try {
        const moveMatch = result.match(/bestmove\s+(\S+)(?:\s+ponder\s+(\S+))?/);
        if (!moveMatch) {
          reject(new Error('No valid move found in engine response'));
          return;
        }
        
        const moveInfo: MoveInfo = {
          move: moveMatch[1],
          ponder: moveMatch[2]
        };
        
        // Add info from last search iteration
        if (lastInfo) {
          moveInfo.score = lastInfo.score;
          moveInfo.depth = lastInfo.depth;
          moveInfo.nodes = lastInfo.nodes;
          moveInfo.nps = lastInfo.nps;
          moveInfo.time = lastInfo.time;
          moveInfo.pv = lastInfo.pv;
        }
        
        resolve(moveInfo);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the current search
   */
  async stop(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }
    
    return new Promise((resolve) => {
      this.engine.send('stop', () => {
        resolve();
      });
    });
  }

  /**
   * Get static evaluation of current position
   */
  async evaluate(): Promise<EvaluationResult> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      this.engine.send('eval', (result: string) => {
        try {
          // Parse evaluation from result
          const lines = result.split('\n');
          let evaluation = 0;
          
          for (const line of lines) {
            if (line.includes('Total evaluation:')) {
              const match = line.match(/Total evaluation:\s*([-+]?\d*\.?\d+)/);
              if (match) {
                evaluation = Math.round(parseFloat(match[1]) * 100); // Convert to centipawns
                break;
              }
            }
          }
          
          resolve({
            evaluation,
            details: result
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Get current position as FEN string
   */
  getFen(): string {
    return this.currentPosition.fen;
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Quit and cleanup the engine
   */
  async quit(): Promise<void> {
    if (this.engine) {
      this.engine.quit();
      this.engine = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
    this.emit('quit');
  }
}

/**
 * Create and initialize a new Stockfish engine instance
 */
export async function createEngine(options: StockfishEngineOptions = {}): Promise<StockfishEngine> {
  const engine = new StockfishEngine(options);
  await engine.init();
  return engine;
}

/**
 * Simple convenience function to get AI move from a position
 */
export async function getAiMove(
  fen: string, 
  moves: string[] = [], 
  searchOptions: SearchOptions = {}
): Promise<MoveInfo> {
  const engine = new StockfishEngine();
  try {
    await engine.init();
    await engine.setPosition({ fen, moves });
    return await engine.getAiMove(searchOptions);
  } finally {
    await engine.quit();
  }
}

export * from './types';
export default StockfishEngine;