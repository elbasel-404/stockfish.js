#!/usr/bin/env node

/**
 * Modern JavaScript example using the new async/await interface
 * This shows how to use the TypeScript-compiled interface from regular JavaScript
 */

const { createEngine, getAiMove } = require('../dist/index');

async function main() {
  console.log('Stockfish.js Modern JavaScript Example\n');

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
    console.error('Error:', error.message);
  }

  // Example 2: Using engine instance for multiple operations
  console.log('2. Using engine instance:');
  let engine = null;
  
  try {
    // Create and initialize engine
    engine = await createEngine({
      threads: 1,
      hashSize: 64
    });

    console.log('Engine ready!');

    // Listen for search info
    engine.on('info', (info) => {
      if (info.depth >= 5) {
        console.log(`Depth ${info.depth}: ${info.score}cp`);
      }
    });

    // Analyze different positions
    const positions = [
      {
        name: 'Starting position',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: []
      },
      {
        name: 'After 1.e4 e5',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: ['e2e4', 'e7e5']
      },
      {
        name: 'Sicilian Defense',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves: ['e2e4', 'c7c5']
      }
    ];

    for (const position of positions) {
      console.log(`\nAnalyzing: ${position.name}`);
      
      await engine.setPosition({
        fen: position.fen,
        moves: position.moves
      });

      const move = await engine.getAiMove({
        depth: 10,
        time: 2000 // 2 second limit
      });

      console.log(`Best move: ${move.move}`);
      console.log(`Score: ${move.score || 'unknown'} centipawns`);
      
      // Get static evaluation
      const eval_ = await engine.evaluate();
      console.log(`Static eval: ${eval_.evaluation} centipawns`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (engine) {
      await engine.quit();
      console.log('\nEngine terminated.');
    }
  }

  // Example 3: Error handling
  console.log('\n3. Error handling example:');
  try {
    // This should handle gracefully if the position is invalid
    const move = await getAiMove('invalid-fen', [], { depth: 1 });
    console.log(`Unexpected success: ${move.move}`);
  } catch (error) {
    console.log(`Handled error gracefully: ${error.message}`);
  }

  console.log('\nAll examples completed!');
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

module.exports = { main };