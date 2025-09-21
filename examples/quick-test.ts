#!/usr/bin/env ts-node

/**
 * Quick test of the modern TypeScript interface using ES modules
 */

import { getAiMove } from '../dist/index.js';

async function quickTest(): Promise<boolean> {
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
    console.error('✗ Error:', (error as Error).message);
    return false;
  }
}

// Handle command line execution
if (require.main === module) {
  quickTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { quickTest };