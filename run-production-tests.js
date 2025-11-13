/**
 * Production Test Runner
 * Runs all production tests and generates a report
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting Production Test Suite\n');
console.log('=' .repeat(60));

const tests = [
  {
    name: 'Backend Health Check',
    command: 'curl -f https://cassino-game-backend.fly.dev/health',
    critical: true
  },
  {
    name: 'Frontend Accessibility',
    command: 'curl -I https://khasinogaming.com/cassino/',
    critical: true
  },
  {
    name: 'Basic Deployment Tests',
    command: 'npx playwright test --config=playwright.production.config.ts tests/e2e/live-deployment-test.spec.ts --reporter=list',
    critical: true
  },
  {
    name: 'Session Management Tests',
    command: 'npx playwright test --config=playwright.production.config.ts tests/e2e/production-session-test.spec.ts --reporter=list',
    critical: false
  }
];

const results = [];
let criticalFailures = 0;

for (const testConfig of tests) {
  console.log(`\n📋 Running: ${testConfig.name}`);
  console.log('-'.repeat(60));
  
  try {
    const output = execSync(testConfig.command, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000 // 2 minutes
    });
    
    console.log('✅ PASSED');
    results.push({
      name: testConfig.name,
      status: 'PASSED',
      output: output.substring(0, 500)
    });
  } catch (error) {
    console.log('❌ FAILED');
    if (testConfig.critical) {
      criticalFailures++;
    }
    
    results.push({
      name: testConfig.name,
      status: 'FAILED',
      error: error.message,
      output: error.stdout?.substring(0, 500) || 'No output'
    });
  }
}

// Generate report
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));

const passed = results.filter(r => r.status === 'PASSED').length;
const failed = results.filter(r => r.status === 'FAILED').length;

console.log(`\nTotal Tests: ${results.length}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`🚨 Critical Failures: ${criticalFailures}`);

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.length,
    passed,
    failed,
    criticalFailures
  },
  results
};

fs.writeFileSync('PRODUCTION_TEST_RESULTS_LATEST.json', JSON.stringify(report, null, 2));
console.log('\n📄 Detailed report saved to: PRODUCTION_TEST_RESULTS_LATEST.json');

// Exit with error if critical tests failed
if (criticalFailures > 0) {
  console.log('\n🚨 CRITICAL TESTS FAILED - Production may have issues!');
  process.exit(1);
} else {
  console.log('\n✅ All critical tests passed!');
  process.exit(0);
}
