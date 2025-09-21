"use strict";
/**
 * Stockfish.js - Modern TypeScript interface
 *
 * This module provides a modern async/await interface for the Stockfish chess engine.
 *
 * @example
 * ```typescript
 * import { createEngine, getAiMove } from 'stockfish';
 *
 * // Simple usage
 * const move = await getAiMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
 * console.log(`Best move: ${move.move}`);
 *
 * // Advanced usage
 * const engine = await createEngine({
 *   threads: 4,
 *   hashSize: 128
 * });
 *
 * await engine.setPosition({
 *   fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
 *   moves: ['e2e4', 'e7e5']
 * });
 *
 * const move = await engine.getAiMove({
 *   depth: 15,
 *   time: 5000
 * });
 *
 * console.log(`Best move: ${move.move} (score: ${move.score})`);
 *
 * await engine.quit();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.getAiMove = exports.createEngine = exports.StockfishEngine = void 0;
var stockfish_1 = require("./stockfish");
Object.defineProperty(exports, "StockfishEngine", { enumerable: true, get: function () { return stockfish_1.StockfishEngine; } });
Object.defineProperty(exports, "createEngine", { enumerable: true, get: function () { return stockfish_1.createEngine; } });
Object.defineProperty(exports, "getAiMove", { enumerable: true, get: function () { return stockfish_1.getAiMove; } });
var stockfish_2 = require("./stockfish");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return stockfish_2.StockfishEngine; } });
//# sourceMappingURL=index.js.map