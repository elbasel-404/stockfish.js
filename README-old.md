### Stockfish.js

<a href="https://github.com/nmrugg/stockfish.js">Stockfish.js</a> is a WASM implementation by Nathan Rugg of the <a href="https://github.com/official-stockfish/Stockfish">Stockfish</a> chess engine, for [Chess.com's](https://www.chess.com/analysis) in-browser engine.

Stockfish.js is currently updated to Stockfish 17.1.

> 🆕 **NEW: TypeScript Support with Async/Await!**
> 
> This repository now includes a modern TypeScript interface with async/await support for easier integration. See the [TypeScript documentation](README-typescript.md) for details.

```javascript
// New async/await interface (recommended)
import { getAiMove } from 'stockfish';

const move = await getAiMove(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  [],
  { depth: 10 }
);
console.log(`Best move: ${move.move} (${move.score}cp)`);
```

## Engine Variants

This edition of Stockfish.js comes in five flavors:

 * The large multi-threaded engine:
    * This is strongest version of the engine, but it is large (≈75MB) and will only run in browsers with the proper <a href=https://web.dev/articles/cross-origin-isolation-guide>CORS headers</a> applied. This engine is recommended if possible.
    * Files: `stockfish-nnue-17.1-[0-9a-f].js` & `stockfish-nnue-17.1-[0-9a-f]-part-\d.wasm`
 * The large single-threaded engine:
    * This is also large but will run in browsers without CORS headers; however it cannot use multiple threads via the UCI command `setoption name Threads`. This engine is recommended if CORS support is not possible.
    * Files: `stockfish-nnue-17.1-single-[0-9a-f].js` & `stockfish-nnue-17.1-single-[0-9a-f]-part-\d.wasm`
 * The lite mult-threaded engine:
    * This is the same as the first multi-threaded but much smaller (≈7MB) and quite a bit weaker. This engine is recommended for mobile browsers when CORS is available.
    * Files: `stockfish-nnue-17.1-lite-[0-9a-f].js` & `stockfish-nnue-17.1-lite-[0-9a-f].wasm`
 * The lite single-threaded engine:
    * Same as the first single-threaded engine but much smaller (≈7MB) and quite a bit weaker. This engine is recommended for mobile browsers that do not support CORS.
    * Files: `stockfish-nnue-17.1-lite-single-[0-9a-f].js` & `stockfish-nnue-17.1-lite-single-[0-9a-f].wasm`
 * The ASM-JS engine:
    * Compiled to JavaScript, not WASM. Compatible with every browser that runs JavaScript. Very slow and weak. Larger than the lite WASM engines (≈10MB). This engine should only be used as a last resort.
    * File: `stockfish-17.1-asm-[0-9a-f].js`

> [!IMPORTANT]
> Due to the difficulty in handling and caching large files, the larger WASM files are split into parts. All parts are required to be in the same location and will be automatically assembled by the engine.

> [!Note]
> Also, the file names may have a hash appended to them.

The ASM-JS engine will run in essentially any browser/runtime that supports JavaScript. The WASM Stockfish.js 17.1 will run on all modern browsers (e.g., Chrome/Edge/Firefox/Opera/Safari) on supported system (Windows 10+/macOS 11+/iOS 16+/Linux/Android), as well as supported versions of Node.js. For slightly older browsers, see the <a href=../../tree/Stockfish16>Stockfish.js 16 branch</a>. For an engine that supports chess variants (like 3-check and Crazyhouse), see the <a href=../../tree/Stockfish11>Stockfish.js 11 branch</a>.

## API

### Modern TypeScript/JavaScript Interface (Recommended)

```javascript
import { createEngine, getAiMove } from 'stockfish';

// Simple usage
const move = await getAiMove(
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  ['e2e4', 'e7e5'],
  { depth: 12 }
);

console.log(`Best move: ${move.move}`);
console.log(`Evaluation: ${move.score} centipawns`);

// Advanced usage
const engine = await createEngine({
  threads: 4,
  hashSize: 128
});

engine.on('info', (info) => {
  console.log(`Depth ${info.depth}: ${info.score}cp`);
});

await engine.setPosition({
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves: ['e2e4']
});

const bestMove = await engine.getAiMove({ time: 5000 });
console.log(`Best move: ${bestMove.move}`);

await engine.quit();
```

For full TypeScript documentation and examples, see [README-typescript.md](README-typescript.md).

### Legacy Callback Interface

In the browser, it is recommended to use the engine via Web Workers. See `examples/loadEngine.js` for a sample implementation.

Stockfish.js can be found in the npm repository and installed like this: `npm install stockfish`.

If you want to use it from the command line, you may want to simply install it globally: `npm install -g stockfish`. Then you can simply run `stockfishjs`.

In Node.js, you can either run it directly from the command line (i.e., `node src/stockfish.js`) or require() it as a module (i.e., `var stockfish = require("stockfish");`).

### Compiling

You need to have <a href="http://kripken.github.io/emscripten-site/docs/getting_started/downloads.html">emscripten `3.1.7`</a> installed and in your path. Then you can compile Stockfish.js with the build script: `./build.js`. See `./build.js --help` for details. To build all flavors, run `./build.js --all`.

### Examples

There are examples in the examples folder. You will need to run the examples/server.js server to view the client-side examples. Then you can test out a simple interface at http://localhost:9091/ or a more complete demo at http://localhost:9091/demo.html.

There are also examples of how to use Stockfish.js via Node.js:

- `examples/typescript-example.ts` - Modern TypeScript interface
- `examples/modern-javascript-example.js` - Modern JavaScript with async/await  
- `examples/comprehensive-demo.js` - Full feature demonstration
- `examples/node_abstraction.js` - Legacy callback interface
- `examples/node_direct.js` - Direct engine communication

### Testing

Run the test suite:

```bash
npm test
```

Run a quick functionality test:

```bash
node examples/quick-test.js
```

#### Next.js Server Actions

For using Stockfish.js with Next.js Server Actions without events, see the comprehensive guide:

- **[Next.js Server Actions Documentation](./NEXTJS_SERVER_ACTIONS.md)** - Complete guide for implementing chess analysis with Server Actions
- **[Next.js Examples](./examples/nextjs/)** - Ready-to-use components, hooks, and utilities

This approach provides a clean, promise-based API that works perfectly with React Server Components and Server Actions, allowing you to get chess analysis results without dealing with event listeners.

### Thanks

- <a href="https://github.com/official-stockfish/Stockfish">The Stockfish team</a>
- <a href="https://github.com/exoticorn/stockfish-js">exoticorn</a>
- <a href="https://github.com/ddugovic/Stockfish">ddugovic</a>
- <a href="https://github.com/niklasf/">niklasf</a> <a href="https://github.com/niklasf/stockfish.js">stockfish.js</a> & <a href="https://github.com/niklasf/stockfish.wasm">stockfish.wasm</a>
- <a href="https://github.com/hi-ogawa/Stockfish">hi-ogawa</a>
- <a href="https://github.com/linrock">linrock</a>

See <a href="https://raw.githubusercontent.com/nmrugg/stockfish.js/master/AUTHORS">AUTHORS</a> for more credits.

### License

(c) 2025, Chess.com, LLC
GPLv3 (see <a href="https://raw.githubusercontent.com/nmrugg/stockfish.js/master/Copying.txt">Copying.txt</a>)
