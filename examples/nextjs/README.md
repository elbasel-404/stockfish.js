# Next.js + Stockfish.js Examples

This directory contains practical examples of using Stockfish.js with Next.js Server Actions.

## Examples Included

1. **stockfish-utils.js** - Core utility functions for Stockfish integration
2. **chess-actions.js** - Next.js Server Actions for chess analysis
3. **useChessAnalysis.js** - React hook for easy client-side usage
4. **ChessAnalyzer.jsx** - Complete React component example
5. **package.json** - Required dependencies

## Quick Start

1. Install dependencies:
   ```bash
   npm install stockfish chess.js
   ```

2. Copy the utility files to your Next.js project:
   - `stockfish-utils.js` → `lib/stockfish-utils.js`
   - `chess-actions.js` → `app/actions/chess-actions.js`
   - `useChessAnalysis.js` → `hooks/useChessAnalysis.js`

3. Use the ChessAnalyzer component or create your own based on the example.

## Key Features

- ✅ Promise-based API (no event handling required)
- ✅ Server-side execution (compatible with Server Actions)
- ✅ Configurable search depth and time limits
- ✅ Error handling and timeouts
- ✅ TypeScript support (types included)
- ✅ Caching support
- ✅ Batch analysis capabilities

## Usage

```javascript
import { getChessBestMove } from '@/app/actions/chess-actions';

// Get best move for starting position
const result = await getChessBestMove(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  { depth: 15, timeLimit: 2000 }
);

if (result.success) {
  console.log('Best move:', result.move);
}
```

See the main documentation at [../../NEXTJS_SERVER_ACTIONS.md](../../NEXTJS_SERVER_ACTIONS.md) for complete details.