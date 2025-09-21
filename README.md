# Stockfish.js

[![License](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](COPYING.txt)
[![npm version](https://badge.fury.io/js/stockfish.svg)](https://badge.fury.io/js/stockfish)

A modern TypeScript/JavaScript interface for the [Stockfish](https://stockfishchess.org/) chess engine, compiled to WebAssembly for maximum performance.

## Features

- 🚀 **Modern async/await API** - No more callbacks
- 📦 **ES Module support** - Works with modern bundlers (Webpack, Vite, Rollup)
- 🔧 **Full TypeScript support** - Complete type definitions included
- ⚡ **WebAssembly powered** - Maximum performance using Stockfish 17.1
- 🌐 **Universal** - Works in Node.js and browsers
- 🎯 **Simple API** - Get started with just a few lines of code

## Installation

```bash
npm install stockfish
```

## Quick Start

### Simple Usage

```typescript
import { getAiMove } from 'stockfish';

// Get the best move from the starting position
const move = await getAiMove(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  [], // no moves played yet
  { depth: 12 }
);

console.log(`Best move: ${move.move}`);
console.log(`Evaluation: ${move.score} centipawns`);
```

### Advanced Usage

```typescript
import { createEngine } from 'stockfish';

// Create and configure an engine instance
const engine = await createEngine({
  threads: 4,
  hashSize: 128
});

// Listen to search progress
engine.on('info', (info) => {
  console.log(`Depth ${info.depth}: ${info.score}cp`);
});

// Set a position
await engine.setPosition({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves: ['e2e4', 'e7e5']
});

// Search for the best move
const move = await engine.getAiMove({
  depth: 15,
  time: 5000  // 5 second maximum
});

console.log(`Best move: ${move.move} (${move.score}cp)`);

// Clean up
await engine.quit();
```

## API Reference

### Functions

#### `getAiMove(fen, moves?, options?)`

Quick way to get the best move for a position.

- `fen: string` - Position in FEN notation
- `moves?: string[]` - Array of moves in UCI notation
- `options?: SearchOptions` - Search configuration

Returns: `Promise<MoveInfo>`

#### `createEngine(options?)`

Create a new engine instance for advanced usage.

- `options?: StockfishEngineOptions` - Engine configuration

Returns: `Promise<StockfishEngine>`

### Types

#### `MoveInfo`

```typescript
interface MoveInfo {
  move: string;        // Best move in UCI notation
  ponder?: string;     // Move to ponder on
  score?: number;      // Evaluation in centipawns
  depth?: number;      // Search depth reached
  nodes?: number;      // Nodes searched
  nps?: number;        // Nodes per second
  time?: number;       // Time taken in milliseconds
  pv?: string[];       // Principal variation
}
```

#### `SearchOptions`

```typescript
interface SearchOptions {
  depth?: number;           // Maximum search depth
  time?: number;            // Maximum search time (ms)
  nodes?: number;           // Maximum nodes to search
  searchMoves?: string[];   // Limit search to these moves
  multiPV?: number;         // Number of principal variations
  infinite?: boolean;       // Infinite search (must stop manually)
}
```

#### `StockfishEngineOptions`

```typescript
interface StockfishEngineOptions {
  threads?: number;         // Number of threads (1-32)
  hashSize?: number;        // Hash table size in MB
  initTimeout?: number;     // Engine initialization timeout
  options?: Record<string, string | number | boolean>; // UCI options
}
```

### Engine Instance Methods

#### `engine.setPosition(position)`
Set the current board position.

#### `engine.getAiMove(options?)`
Get the best move for the current position.

#### `engine.evaluate()`
Get static evaluation of the current position.

#### `engine.stop()`
Stop the current search.

#### `engine.quit()`
Terminate the engine and clean up resources.

### Events

The engine emits the following events:

- `ready` - Engine is initialized and ready
- `info` - Search progress information
- `data` - Raw engine output
- `quit` - Engine has been terminated

## Examples

Run the included examples:

```bash
# Quick test
npm run example:quick

# Advanced example
npm run example:modern
```

## Building from Source

```bash
git clone https://github.com/nmrugg/stockfish.js
cd stockfish.js
npm install
npm run build
npm test
```

## Local Package Testing

For testing the package locally before publishing:

```bash
# Create a local npm package (.tgz file)
npm run pack:local

# Create and verify the package works correctly
npm run pack:verify

# Install the package globally for testing
npm run pack:test

# Clean up generated package files
npm run pack:clean
```

The `pack:verify` script creates a temporary test environment, installs the local package, and verifies that all exports work correctly.

## Module Bundler Support

This package is designed to work seamlessly with modern JavaScript bundlers:

- ✅ **Webpack 5+** - Full support with proper ES module handling
- ✅ **Vite** - Native ES module support
- ✅ **Rollup** - Works with @rollup/plugin-node-resolve
- ✅ **Parcel** - Automatic ES module detection
- ✅ **esbuild** - Fast builds with ES module support

## Browser Support

- Chrome 87+
- Firefox 84+
- Safari 14+
- Edge 88+

Requires WebAssembly and SharedArrayBuffer support.

## Node.js Support

- Node.js 16+ (for stable ES module support)
- Requires `--experimental-wasm-threads --experimental-wasm-simd` flags for Node.js 14-18

## Performance Tips

1. **Reuse Engine Instances** - Create one engine and reuse it for multiple positions
2. **Adjust Hash Size** - Larger hash tables improve search quality (default: 16MB)
3. **Use Multiple Threads** - Set `threads` option for faster searches on multi-core systems
4. **Time Limits** - Use `time` option instead of `depth` for consistent performance
5. **Stop Long Searches** - Use `engine.stop()` to interrupt long calculations

## License

GPL-3.0 (same as original Stockfish)

Based on [Stockfish](https://stockfishchess.org/) chess engine.

## Contributing

Contributions are welcome! Please read the contributing guidelines and submit pull requests to the main repository.