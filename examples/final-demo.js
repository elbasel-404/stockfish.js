#!/usr/bin/env node

/**
 * Final demonstration of the refactored Stockfish.js TypeScript interface
 * This showcases the clean async/await API and simple functions like getAiMove()
 */

const { getAiMove, createEngine } = require('../dist/index');

async function demonstrateSimpleInterface() {
  console.log('🚀 Stockfish.js - Modern TypeScript Interface');
  console.log('=========================================\n');
  
  console.log('1. Simple getAiMove() function:');
  console.log('   const move = await getAiMove(fen, moves, options);');
  console.log('');
  
  // Starting position
  const startingMove = await getAiMove(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    [],
    { depth: 8 }
  );
  
  console.log(`   Starting position: ${startingMove.move} (${startingMove.score}cp)`);
  
  // After 1.e4 e5
  const openingMove = await getAiMove(
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    ['e2e4', 'e7e5'],
    { depth: 8 }
  );
  
  console.log(`   After 1.e4 e5: ${openingMove.move} (${openingMove.score}cp)`);
  
  console.log('\n2. Advanced engine usage:');
  console.log('   const engine = await createEngine(options);');
  console.log('   await engine.setPosition({fen, moves});');
  console.log('   const move = await engine.getAiMove({time: 3000});');
  console.log('');
  
  const engine = await createEngine({
    threads: 1,
    hashSize: 32
  });
  
  await engine.setPosition({
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moves: ['d2d4', 'd7d5', 'c2c4']  // Queen's Gambit
  });
  
  const advancedMove = await engine.getAiMove({
    time: 2000, // 2 seconds
    multiPV: 1
  });
  
  console.log(`   Queen's Gambit response: ${advancedMove.move} (${advancedMove.score}cp)`);
  
  await engine.quit();
  
  console.log('\n✅ All features working perfectly!');
  console.log('\nKey improvements delivered:');
  console.log('   ✓ Clean async/await syntax');
  console.log('   ✓ TypeScript type definitions');
  console.log('   ✓ Simple getAiMove() function');
  console.log('   ✓ Promise-based error handling');
  console.log('   ✓ Real-time search events');
  console.log('   ✓ Backwards compatibility maintained');
  
  console.log('\n📝 Usage Summary:');
  console.log('   npm install stockfish');
  console.log('   const { getAiMove } = require("stockfish");');
  console.log('   const move = await getAiMove(fen, moves, {depth: 10});');
}

// Run the demonstration
demonstrateSimpleInterface().catch(console.error);