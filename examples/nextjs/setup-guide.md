# Setup Guide for Stockfish.js with Next.js Server Actions

This guide walks you through setting up Stockfish.js with Next.js Server Actions step by step.

## Prerequisites

- Node.js 18.0.0 or higher
- Next.js 14.0.0 or higher
- A Next.js project with the `app` directory structure

## Installation

1. **Install the stockfish package:**
   ```bash
   npm install stockfish
   ```

2. **Optional: Install chess.js for move validation and game logic:**
   ```bash
   npm install chess.js
   ```

## Project Structure

Your Next.js project should have this structure:

```
your-nextjs-app/
├── app/
│   ├── actions/
│   │   └── chess-actions.js      # Server Actions
│   └── page.js                   # Your main page
├── components/
│   └── ChessAnalyzer.jsx         # React component
├── hooks/
│   └── useChessAnalysis.js       # Custom hook
├── lib/
│   └── stockfish-utils.js        # Utility functions
└── package.json
```

## Step-by-Step Setup

### Step 1: Create the Utility Functions

Create `lib/stockfish-utils.js`:

```javascript
// This is the simplified approach - copy from stockfish-utils-simple.js
export function getBestMove(fen, options = {}) {
  // ... (see the main documentation for full implementation)
}

export function getBestMoveWithEvaluation(fen, options = {}) {
  // ... (see the main documentation for full implementation)
}

export function isValidFEN(fen) {
  // ... (see the main documentation for full implementation)
}
```

### Step 2: Create Server Actions

Create `app/actions/chess-actions.js`:

```javascript
'use server';

import { getBestMove, getBestMoveWithEvaluation, isValidFEN } from '@/lib/stockfish-utils';

export async function getChessBestMove(fen, options = {}) {
  // ... (see the main documentation for full implementation)
}

export async function getChessAnalysis(fen, options = {}) {
  // ... (see the main documentation for full implementation)
}
```

### Step 3: Create a Custom Hook (Optional)

Create `hooks/useChessAnalysis.js`:

```javascript
'use client';

import { useState, useCallback } from 'react';
import { getChessBestMove, getChessAnalysis } from '@/app/actions/chess-actions';

export function useChessAnalysis() {
  // ... (see the main documentation for full implementation)
}
```

### Step 4: Create a React Component

Create `components/ChessAnalyzer.jsx`:

```javascript
'use client';

import { useChessAnalysis } from '@/hooks/useChessAnalysis';

export default function ChessAnalyzer() {
  // ... (see the main documentation for full implementation)
}
```

### Step 5: Use in Your App

Update `app/page.js`:

```javascript
import ChessAnalyzer from '@/components/ChessAnalyzer';

export default function Home() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Chess Analysis</h1>
      <ChessAnalyzer />
    </main>
  );
}
```

## Important Configuration Notes

### Next.js Configuration

You may need to add this to your `next.config.js` to handle the WASM files:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'stockfish': 'commonjs stockfish',
      });
    }
    
    // Handle WASM files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    return config;
  },
};

module.exports = nextConfig;
```

### Environment Variables

If you're deploying to platforms like Vercel, you may need to set these environment variables:

```bash
# .env.local
NODE_OPTIONS="--experimental-wasm-threads --experimental-wasm-simd"
```

### Package.json Scripts

Update your `package.json` scripts if needed:

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--experimental-wasm-threads --experimental-wasm-simd' next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

## Testing Your Setup

Create a simple test page to verify everything works:

```javascript
// app/test/page.js
import { getChessBestMove } from '@/app/actions/chess-actions';

async function TestPage() {
  const startingPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  
  try {
    const result = await getChessBestMove(startingPosition, {
      depth: 10,
      timeLimit: 2000
    });
    
    return (
      <div className="p-8">
        <h1>Stockfish Test</h1>
        {result.success ? (
          <p>✅ Best move: {result.move}</p>
        ) : (
          <p>❌ Error: {result.error}</p>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1>Stockfish Test</h1>
        <p>❌ Error: {error.message}</p>
      </div>
    );
  }
}

export default TestPage;
```

## Troubleshooting

### Common Issues and Solutions

1. **"Cannot find module 'stockfish'" Error:**
   - Make sure you've installed the stockfish package: `npm install stockfish`
   - Check that your import paths are correct

2. **WASM Loading Errors:**
   - Ensure your Next.js configuration includes WASM support
   - Try using the simplified utility version first
   - Check that Node.js flags are set if needed

3. **Server Action Timeout:**
   - Increase the timeout values in your utility functions
   - Reduce the search depth for faster results
   - Check your deployment platform's timeout limits

4. **Memory Issues:**
   - Limit concurrent engine instances
   - Ensure engines are properly terminated after use
   - Consider implementing a singleton pattern for the engine

5. **Deployment Issues:**
   - Test locally first with `npm run build && npm run start`
   - Check platform-specific requirements (Vercel, AWS, etc.)
   - Ensure WASM files are included in the build

### Performance Tips

1. **Use appropriate search depths:**
   - Interactive: depth 8-12
   - Analysis: depth 15-18
   - Deep analysis: depth 20+

2. **Implement caching:**
   - Cache frequently analyzed positions
   - Use React's built-in caching with Server Actions

3. **Batch requests:**
   - Analyze multiple positions in parallel when possible
   - Use Promise.all() for concurrent analysis

## Next Steps

Once you have the basic setup working:

1. Add position visualization (chess board UI)
2. Implement game tree analysis
3. Add opening book integration
4. Create analysis reports
5. Add multiplayer features

For more advanced features and complete examples, see the main documentation at [../../NEXTJS_SERVER_ACTIONS.md](../../NEXTJS_SERVER_ACTIONS.md).