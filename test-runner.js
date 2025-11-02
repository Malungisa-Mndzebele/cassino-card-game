#!/usr/bin/env node
/**
 * Test runner script to run E2E tests one by one
 * This script runs each test file sequentially and reports results
 */

const { execSync } = require('child_process');
const path = require('path');

const tests = [
  { file: 'tests/e2e/simple-smoke-test.spec.ts', name: 'Smoke Tests' },
  { file: 'tests/e2e/create-join.spec.ts', name: 'Create/Join Tests' },
  { file: 'tests/e2e/random-join.spec.ts', name: 'Random Join Tests' },
  { file: 'tests/e2e/full-game-flow.spec.ts', name: 'Full Game Flow Tests' },
  { file: 'tests/e2e/comprehensive-game.spec.ts', name: 'Comprehensive Game Tests' },
];

const results = [];

console.log('🧪 Starting E2E Test Suite');
console.log('=' .repeat(50));

for (let i = 0; i < tests.length; i++) {
  const test = tests[i];
  console.log(`\n[${i + 1}/${tests.length}] Running: ${test.name}`);
  console.log(`File: ${test.file}`);
  console.log('-'.repeat(50));

  try {
    const startTime = Date.now();
    execSync(
      `npx playwright test "${test.file}" --project=chromium --timeout=60000 --max-failures=1 --reporter=list`,
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      }
    );
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    results.push({ test: test.name, status: 'PASSED', duration });
    console.log(`\n✅ PASSED: ${test.name} (${duration}s)`);
  } catch (error) {
    const duration = error.duration ? (error.duration / 1000).toFixed(2) : 'N/A';
    results.push({ test: test.name, status: 'FAILED', duration });
    console.log(`\n❌ FAILED: ${test.name} (${duration}s)`);
    console.log(`Error: ${error.message || 'Unknown error'}`);
    
    // Ask if we should continue
    console.log('\n⚠️  Test failed. Continuing to next test...\n');
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary');
console.log('='.repeat(50));

const passed = results.filter(r => r.status === 'PASSED').length;
const failed = results.filter(r => r.status === 'FAILED').length;

results.forEach(result => {
  const icon = result.status === 'PASSED' ? '✅' : '❌';
  console.log(`${icon} ${result.test}: ${result.status} (${result.duration}s)`);
});

console.log('\n' + '='.repeat(50));
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
console.log('='.repeat(50));

process.exit(failed > 0 ? 1 : 0);

