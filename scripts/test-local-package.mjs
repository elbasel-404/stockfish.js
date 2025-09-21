#!/usr/bin/env node

/**
 * Test script to verify the local npm package works correctly
 * This script creates a temporary directory, installs the local package,
 * and tests that it can be imported and used.
 */

import { execSync } from 'child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🧪 Testing local npm package...\n');

// Find the package file
const packageFiles = execSync('ls stockfish-*.tgz', { 
  cwd: projectRoot, 
  encoding: 'utf8' 
}).trim().split('\n');

if (packageFiles.length === 0 || packageFiles[0] === '') {
  console.error('❌ No package file found. Run "npm run pack" first.');
  process.exit(1);
}

const packageFile = packageFiles[0];
console.log(`📦 Found package: ${packageFile}`);

// Create temporary test directory
const testDir = join(projectRoot, 'temp-package-test');
if (existsSync(testDir)) {
  rmSync(testDir, { recursive: true, force: true });
}
mkdirSync(testDir, { recursive: true });

try {
  // Create a test package.json
  const testPackageJson = {
    "name": "stockfish-test",
    "version": "1.0.0",
    "type": "module",
    "private": true
  };
  
  writeFileSync(
    join(testDir, 'package.json'), 
    JSON.stringify(testPackageJson, null, 2)
  );

  // Install the local package
  console.log('📥 Installing local package...');
  execSync(`npm install ${join(projectRoot, packageFile)}`, {
    cwd: testDir,
    stdio: 'pipe'
  });

  // Create a test script
  const testScript = `
import { createEngine, getAiMove } from 'stockfish';

console.log('✅ Import successful');
console.log('Available functions:');
console.log('- createEngine:', typeof createEngine);
console.log('- getAiMove:', typeof getAiMove);

console.log('\\n🎉 Local package test passed!');
`;

  writeFileSync(join(testDir, 'test.mjs'), testScript);

  // Run the test
  console.log('🔍 Testing package imports...');
  execSync('node test.mjs', {
    cwd: testDir,
    stdio: 'inherit'
  });

  console.log('\n✅ Local package verification completed successfully!');
  
} catch (error) {
  console.error('\n❌ Package test failed:', error.message);
  process.exit(1);
} finally {
  // Clean up
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true, force: true });
  }
}