#!/usr/bin/env node

/**
 * Quick test of the new TypeScript interface using ES modules
 */

import { getAiMove } from '../dist/index.js';

async function quickTest() {
  console.log('Quick test of TypeScript interface (ES Modules)...');
  
  try {
    const move = await getAiMove(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      [],
      { depth: 5 }
    );
    
    console.log(`✓ Success! Best move: ${move.move}`);
    console.log(`  Score: ${move.score} centipawns`);
    console.log(`  Depth: ${move.depth}`);
    console.log(`  Nodes: ${move.nodes}`);
    return true;
  } catch (error) {
    console.error('✗ Error:', error.message);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  quickTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { quickTest };