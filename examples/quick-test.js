#!/usr/bin/env node

/**
 * Quick test of the new TypeScript interface
 */

const { getAiMove } = require('../dist/index');

async function quickTest() {
  console.log('Quick test of TypeScript interface...');
  
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

if (require.main === module) {
  quickTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { quickTest };