#!/usr/bin/env ts-node

/**
 * Modern TypeScript example showing the full async/await interface
 * This demonstrates how to use the TypeScript-compiled interface with ES modules
 */

import { createEngine, getAiMove, StockfishEngine } from '../dist/index.js';

async function main(): Promise<void> {
  console.log('Stockfish.js Modern TypeScript Example (ES Modules)\n');

  // Example 1: Quick AI move
  console.log('1. Getting AI move with simple function:');
  try {
    const move = await getAiMove(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      [],
      { depth: 8 }
    );
    
    console.log(`Best move: ${move.move}`);
    console.log(`Evaluation: ${move.score || 'unknown'} centipawns`);
    console.log(`Depth: ${move.depth || 'unknown'}`);
    console.log('');
  } catch (error) {
    console.error('Error:', (error as Error).message);
  }

  // Example 2: Using engine instance for multiple operations
  console.log('2. Using engine instance:');
  let engine: StockfishEngine | null = null;
  
  try {
    // Create and initialize engine
    engine = await createEngine({
      threads: 1,
      hashSize: 64
    });

    console.log('✓ Engine initialized successfully');

    // Set up info listener
    engine.on('info', (info) => {
      if (info.depth && info.score !== undefined) {
        console.log(`  Depth ${info.depth}: ${info.score}cp`);
      }
    });

    // Set position
    await engine.setPosition({
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      moves: []
    });

    console.log('✓ Position set: after 1.e4');

    // Get best move
    const move = await engine.getAiMove({
      depth: 10,
      time: 3000  // 3 seconds max
    });

    console.log(`✓ Best response: ${move.move}`);
    console.log(`  Evaluation: ${move.score || 'unknown'} centipawns`);
    console.log(`  Depth: ${move.depth || 'unknown'}`);
    console.log(`  Nodes: ${move.nodes || 'unknown'}`);
    console.log(`  Time: ${move.time || 'unknown'}ms`);

    if (move.pv && move.pv.length > 0) {
      console.log(`  Principal variation: ${move.pv.slice(0, 5).join(' ')}`);
    }

  } catch (error) {
    console.error('Error with engine instance:', (error as Error).message);
  } finally {
    // Always clean up
    if (engine) {
      await engine.quit();
      console.log('✓ Engine terminated cleanly');
    }
  }

  console.log('\nExample completed!');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the examples
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main };