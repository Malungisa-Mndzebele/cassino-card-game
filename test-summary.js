// Comprehensive Test Summary Script
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Running Comprehensive Test Suite\n');
console.log('═══════════════════════════════════════════════════\n');

const results = {
  backend: { status: 'pending', passed: 0, failed: 0, error: null },
  frontend: { status: 'pending', passed: 0, failed: 0, error: null },
  production: { status: 'pending', passed: 0, failed: 0, error: null }
};

// Test 1: Backend Tests
console.log('1️⃣  Backend Tests (Python)...');
try {
  const output = execSync('cd backend && python test_api_comprehensive.py', { 
    encoding: 'utf-8',
    timeout: 60000 
  });
  
  // Parse output for pass/fail
  if (output.includes('OK') || output.includes('passed')) {
    results.backend.status = 'passed';
    const match = output.match(/(\d+)\s+passed/);
    if (match) results.backend.passed = parseInt(match[1]);
    console.log('   ✅ Backend tests passed\n');
  } else {
    results.backend.status = 'unknown';
    console.log('   ⚠️  Backend tests completed (check manually)\n');
  }
} catch (error) {
  results.backend.status = 'failed';
  results.backend.error = error.message;
  console.log('   ❌ Backend tests failed\n');
}

// Test 2: Frontend Tests
console.log('2️⃣  Frontend Tests (Vitest)...');
try {
  const output = execSync('npm run test:frontend -- --run --reporter=json', { 
    encoding: 'utf-8',
    timeout: 60000 
  });
  
  try {
    const jsonMatch = output.match(/\{[\s\S]*"testResults"[\s\S]*\}/);
    if (jsonMatch) {
      const testData = JSON.parse(jsonMatch[0]);
      results.frontend.passed = testData.numPassedTests || 0;
      results.frontend.failed = testData.numFailedTests || 0;
      results.frontend.status = testData.numFailedTests === 0 ? 'passed' : 'failed';
    }
  } catch (e) {
    // Fallback parsing
    if (output.includes('passed')) {
      results.frontend.status = 'passed';
      console.log('   ✅ Frontend tests passed\n');
    }
  }
  
  if (results.frontend.status === 'passed') {
    console.log(`   ✅ Frontend tests passed (${results.frontend.passed} tests)\n`);
  }
} catch (error) {
  results.frontend.status = 'failed';
  results.frontend.error = error.message;
  console.log('   ❌ Frontend tests failed\n');
}

// Test 3: Production Smoke Test
console.log('3️⃣  Production Smoke Tests...');
try {
  const output = execSync('npm run test:production', { 
    encoding: 'utf-8',
    timeout: 120000 
  });
  
  if (output.includes('passed')) {
    const match = output.match(/(\d+)\s+passed/);
    if (match) {
      results.production.passed = parseInt(match[1]);
      results.production.status = 'passed';
      console.log(`   ✅ Production tests passed (${results.production.passed} tests)\n`);
    }
  }
} catch (error) {
  results.production.status = 'failed';
  results.production.error = error.message;
  console.log('   ❌ Production tests failed\n');
}

// Summary
console.log('═══════════════════════════════════════════════════');
console.log('📊 Test Summary:\n');
console.log(`Backend Tests:     ${getStatusIcon(results.backend.status)} ${results.backend.status.toUpperCase()}`);
console.log(`Frontend Tests:    ${getStatusIcon(results.frontend.status)} ${results.frontend.status.toUpperCase()}`);
console.log(`Production Tests:  ${getStatusIcon(results.production.status)} ${results.production.status.toUpperCase()}`);
console.log('═══════════════════════════════════════════════════\n');

// Overall status
const allPassed = Object.values(results).every(r => r.status === 'passed');
if (allPassed) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed or need attention');
  process.exit(1);
}

function getStatusIcon(status) {
  switch(status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'pending': return '⏳';
    default: return '⚠️';
  }
}
