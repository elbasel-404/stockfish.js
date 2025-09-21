# Stockfish.js - TypeScript Interface

This document describes the new modern TypeScript interface for Stockfish.js, which provides async/await support and strongly-typed APIs.

## Features

- ✅ **TypeScript Support**: Full type definitions for all APIs
- ✅ **Async/Await**: Modern Promise-based interface
- ✅ **Simple API**: Easy-to-use functions like `getAiMove()`
- ✅ **Event-Driven**: Real-time search information via events
- ✅ **Error Handling**: Proper error handling with try/catch
- ✅ **Backwards Compatible**: Original callback interface still available

## Installation

```bash
npm install stockfish
```

For TypeScript development:
```bash
npm install -D typescript @types/node
```

## Quick Start

### JavaScript (ES6+)
```javascript
const { getAiMove } = require('stockfish');

async function main() {
  // Get AI move from starting position
  const move = await getAiMove(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [], // no moves played yet
    { depth: 10 }
  );
  
  console.log(`Best move: ${move.move}`);
  console.log(`Evaluation: ${move.score} centipawns`);
}

main().catch(console.error);
```

### TypeScript
```typescript
import { createEngine, getAiMove, MoveInfo } from 'stockfish';

async function main(): Promise<void> {
  // Simple usage
  const move: MoveInfo = await getAiMove(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [],
    { depth: 12 }
  );
  
  console.log(`Best move: ${move.move} (${move.score}cp)`);
  
  // Advanced usage with engine instance
  const engine = await createEngine({
    threads: 4,
    hashSize: 128
  });
  
  // Listen for search progress
  engine.on('info', (info) => {
    console.log(`Depth ${info.depth}: ${info.score}cp`);
  });
  
  // Set position
  await engine.setPosition({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['e2e4', 'e7e5', 'g1f3']
  });
  
  // Search for best move
  const bestMove = await engine.getAiMove({
    depth: 15,
    time: 5000
  });
  
  console.log(`Best continuation: ${bestMove.move}`);
  
  // Clean up
  await engine.quit();
}
```

## API Reference

### Functions

#### `getAiMove(fen, moves, options): Promise<MoveInfo>`
Simple function to get the best move for a position.

**Parameters:**
- `fen` (string): Position in FEN notation
- `moves` (string[]): Array of moves in UCI notation (optional)
- `options` (SearchOptions): Search parameters (optional)

**Returns:** Promise that resolves with move information

#### `createEngine(options): Promise<StockfishEngine>`
Creates and initializes a new engine instance.

**Parameters:**
- `options` (StockfishEngineOptions): Engine configuration (optional)

**Returns:** Promise that resolves with initialized engine

### Classes

#### `StockfishEngine`
Main engine class for advanced usage.

**Methods:**
- `init(): Promise<void>` - Initialize the engine
- `setPosition(position): Promise<void>` - Set the current position
- `getAiMove(options): Promise<MoveInfo>` - Search for best move
- `evaluate(): Promise<EvaluationResult>` - Get static evaluation
- `stop(): Promise<void>` - Stop current search
- `quit(): Promise<void>` - Terminate the engine
- `isReady(): boolean` - Check if engine is initialized
- `getFen(): string` - Get current position FEN

**Events:**
- `ready` - Engine is ready for use
- `info` - Search information during analysis
- `data` - Raw engine output
- `quit` - Engine has been terminated

### Types

#### `MoveInfo`
```typescript
interface MoveInfo {
  move: string;        // Best move in UCI notation (e.g., "e2e4")
  ponder?: string;     // Move to ponder on
  score?: number;      // Evaluation in centipawns
  depth?: number;      // Search depth
  nodes?: number;      // Nodes searched
  nps?: number;        // Nodes per second
  time?: number;       // Time taken (ms)
  pv?: string[];       // Principal variation
  wdl?: {              // Win-Draw-Loss probabilities
    win: number;
    draw: number;
    loss: number;
  };
}
```

#### `SearchOptions`
```typescript
interface SearchOptions {
  depth?: number;         // Maximum search depth
  time?: number;          // Maximum time in milliseconds
  nodes?: number;         // Maximum nodes to search
  infinite?: boolean;     // Infinite search (must stop manually)
  searchMoves?: string[]; // Only search these moves
  multiPV?: number;       // Number of principal variations
}
```

#### `StockfishEngineOptions`
```typescript
interface StockfishEngineOptions {
  enginePath?: string;                    // Path to engine binary
  initTimeout?: number;                   // Initialization timeout (ms)
  threads?: number;                       // Number of threads (1-32)
  hashSize?: number;                      // Hash table size in MB
  options?: Record<string, any>;          // UCI engine options
}
```

## Examples

### Analyze Multiple Positions
```typescript
import { createEngine } from 'stockfish';

const engine = await createEngine({ threads: 2 });

const positions = [
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2'
];

for (const fen of positions) {
  await engine.setPosition({ fen });
  const move = await engine.getAiMove({ depth: 12 });
  console.log(`${fen} => ${move.move} (${move.score}cp)`);
}

await engine.quit();
```

### Real-time Search Updates
```typescript
import { createEngine } from 'stockfish';

const engine = await createEngine();

engine.on('info', (info) => {
  console.log(`Depth ${info.depth}: ${info.pv?.[0]} (${info.score}cp)`);
});

await engine.setPosition({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
});

const move = await engine.getAiMove({ depth: 20 });
console.log(`Final: ${move.move}`);

await engine.quit();
```

### Error Handling
```typescript
import { getAiMove } from 'stockfish';

try {
  const move = await getAiMove('invalid-fen', [], { depth: 10 });
  console.log(move.move);
} catch (error) {
  console.error('Engine error:', error.message);
}
```

## Migration from Callback API

### Old Callback Style
```javascript
const loadEngine = require('./examples/loadEngine.js');
const engine = loadEngine();

engine.send('uci', () => {
  engine.send('position startpos', () => {
    engine.send('go depth 10', (result) => {
      const move = result.match(/bestmove (\w+)/)[1];
      console.log('Best move:', move);
      engine.quit();
    });
  });
});
```

### New Async/Await Style
```javascript
const { getAiMove } = require('stockfish');

async function main() {
  const move = await getAiMove(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [],
    { depth: 10 }
  );
  console.log('Best move:', move.move);
}

main().catch(console.error);
```

## Building from Source

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run example
node examples/modern-javascript-example.js
```

## Compatibility

- Node.js 16+ (for modern async/await support)
- TypeScript 4.5+ (if using TypeScript)
- All major browsers (for WASM builds)
- The original callback-based API remains available for backwards compatibility

## Performance Tips

1. **Reuse Engine Instances**: Create one engine and reuse it for multiple positions
2. **Adjust Hash Size**: Larger hash tables improve search quality
3. **Use Multiple Threads**: Set `threads` option for faster searches
4. **Time Limits**: Use `time` option instead of `depth` for consistent performance
5. **Stop Long Searches**: Use `engine.stop()` to interrupt long calculations

## License

GPL-3.0 (same as original Stockfish)