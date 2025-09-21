#!/usr/bin/env ts-node

/**
 * TypeScript example showing the new async/await interface for Stockfish
 */

import { createEngine, getAiMove, StockfishEngine } from '../lib/index';

async function main() {
  console.log('Stockfish.js TypeScript Example\n');

  // Example 1: Simple usage with the convenience function
  console.log('1. Simple usage with getAiMove():');
  try {
    const startPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const move = await getAiMove(startPosition, [], { depth: 10 });
    console.log(`Best move from starting position: ${move.move}`);
    if (move.score !== undefined) {
      console.log(`Evaluation: ${move.score} centipawns`);
    }
    console.log(`Search depth: ${move.depth || 'unknown'}`);
    console.log(`Nodes: ${move.nodes || 'unknown'}`);
    console.log('');
  } catch (error) {
    console.error('Error in simple example:', error);
  }

  // Example 2: Advanced usage with engine instance
  console.log('2. Advanced usage with engine instance:');
  let engine: StockfishEngine | null = null;
  
  try {
    // Create engine with custom options
    engine = await createEngine({
      threads: 1, // Use 1 thread for compatibility
      hashSize: 32, // 32MB hash table
      options: {
        'MultiPV': 3, // Show top 3 moves
        'UCI_ShowWDL': true
      }
    });

    console.log('Engine initialized successfully');

    // Set up event listeners
    engine.on('info', (info) => {
      if (info.depth >= 8) { // Only show deeper searches
        console.log(`Depth ${info.depth}: ${info.score} cp, ${info.nodes} nodes, pv: ${info.pv?.slice(0, 3).join(' ')}`);
      }
    });

    // Set position after 1.e4 e5 2.Nf3
    await engine.setPosition({
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      moves: ['e2e4', 'e7e5', 'g1f3']
    });

    console.log('Position set to: 1.e4 e5 2.Nf3');

    // Search for best move
    const moveInfo = await engine.getAiMove({
      depth: 12,
      multiPV: 1 // Just the best move
    });

    console.log(`\nBest move: ${moveInfo.move}`);
    if (moveInfo.ponder) {
      console.log(`Ponder move: ${moveInfo.ponder}`);
    }
    console.log(`Final evaluation: ${moveInfo.score} centipawns`);
    console.log(`Principal variation: ${moveInfo.pv?.join(' ')}`);

    // Get static evaluation
    console.log('\n3. Static evaluation:');
    const evaluation = await engine.evaluate();
    console.log(`Static eval: ${evaluation.evaluation} centipawns`);

  } catch (error) {
    console.error('Error in advanced example:', error);
  } finally {
    if (engine) {
      await engine.quit();
      console.log('\nEngine terminated');
    }
  }

  // Example 3: Quick analysis of a tactical position
  console.log('\n4. Tactical position analysis:');
  try {
    // Famous "Legal's Mate" position
    const tacticalFen = 'rnbqkb1r/pppp1ppp/5n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4';
    
    const tacticalMove = await getAiMove(tacticalFen, [], {
      depth: 15,
      time: 3000 // 3 seconds max
    });

    console.log(`Tactical position FEN: ${tacticalFen}`);
    console.log(`Best move: ${tacticalMove.move}`);
    console.log(`Evaluation: ${tacticalMove.score} centipawns`);
    
  } catch (error) {
    console.error('Error in tactical example:', error);
  }

  console.log('\nExamples completed!');
}

// Handle command line execution
if (require.main === module) {
  main().catch(console.error);
}

export { main };