#!/usr/bin/env node
/**
 * Run only local tests (exclude production/deployment tests)
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Local Tests Only\n');
console.log('='.repeat(60));

let totalPassed = 0;
let totalFailed = 0;

// Helper to run command and capture output
function runTest(name, command, cwd = process.cwd()) {
  console.log(`\n📋 ${name}`);
  console.log('-'.repeat(60));
  try {
    const output = execSync(command, { 
      cwd, 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log(`✅ ${name} - PASSED`);
    totalPassed++;
    return true;
  } catch (error) {
    console.error(`❌ ${name} - FAILED`);
    totalFailed++;
    return false;
  }
}

// 1. Backend Game Logic Tests
console.log('\n🔧 Backend Tests');
runTest('Game Logic Tests', 'python test_game_logic_simple.py', path.join(__dirname, 'backend'));

// 2. Backend API Tests (comprehensive)
runTest('API Comprehensive Tests', 'python test_api_comprehensive.py', path.join(__dirname, 'backend'));

// 3. Backend API Simple Tests
runTest('API Simple Tests', 'python test_main_simple.py', path.join(__dirname, 'backend'));

// 4. Frontend Tests
console.log('\n\n⚛️  Frontend Tests');
runTest('Frontend Component Tests', 'npm run test:frontend');

// 5. Local E2E Tests (exclude production tests)
console.log('\n\n🎭 Local E2E Tests');
console.log('Note: E2E tests require backend to be running');
console.log('Start backend with: npm run start:backend\n');

// Run specific local E2E tests (exclude production-*.spec.ts and live-deployment-test.spec.ts)
const localE2ETests = [
  'tests/e2e/create-join.spec.ts',
  'tests/e2e/full-game-flow.spec.ts',
  'tests/e2e/complete-game-scenarios.spec.ts',
  'tests/e2e/random-join.spec.ts',
  'tests/e2e/websocket-test.spec.ts',
  'tests/e2e/fixed-smoke-test.spec.ts',
  'tests/performance/load-test.spec.ts'
];

// Check if backend is running before E2E tests
try {
  const http = require('http');
  const checkBackend = () => {
    return new Promise((resolve) => {
      const req = http.get('http://localhost:8000/health', { timeout: 2000 }, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  };

  const backendRunning = checkBackend();
  if (!backendRunning) {
    console.log('⚠️  Backend not running - skipping E2E tests');
    console.log('   Start backend with: npm run start:backend');
    console.log('   Then run: npx playwright test ' + localE2ETests.join(' '));
  } else {
    console.log('✅ Backend is running - running E2E tests...\n');
    for (const testFile of localE2ETests) {
      runTest(`E2E: ${path.basename(testFile)}`, `npx playwright test ${testFile}`, process.cwd());
    }
  }
} catch (error) {
  console.log('⚠️  Could not check backend status - skipping E2E tests');
  console.log('   Run manually: npx playwright test ' + localE2ETests.join(' '));
}

// Summary
console.log('\n\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${totalPassed}`);
console.log(`❌ Failed: ${totalFailed}`);
console.log(`📈 Total:  ${totalPassed + totalFailed}`);
console.log('='.repeat(60));

if (totalFailed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}

