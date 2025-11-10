#!/usr/bin/env node

/**
 * Deploy and Test Script
 * Monitors GitHub Actions deployment and runs live tests when complete
 */

const https = require('https');
const { execSync } = require('child_process');

const GITHUB_REPO = 'Malungisa-Mndzebele/cassino-card-game';
const WORKFLOW_NAME = 'Deploy Frontend to khasinogaming.com';
const CHECK_INTERVAL = 15000; // 15 seconds
const MAX_WAIT_TIME = 600000; // 10 minutes

console.log('🚀 Deployment and Test Monitor');
console.log('================================\n');

/**
 * Get the latest workflow run status
 */
async function getWorkflowStatus() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_REPO}/actions/runs?per_page=1`,
      headers: {
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.workflow_runs && json.workflow_runs.length > 0) {
            const run = json.workflow_runs[0];
            resolve({
              id: run.id,
              name: run.name,
              status: run.status,
              conclusion: run.conclusion,
              url: run.html_url,
              created_at: run.created_at
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Wait for deployment to complete
 */
async function waitForDeployment() {
  const startTime = Date.now();
  let lastStatus = '';

  console.log('⏳ Waiting for GitHub Actions deployment to complete...\n');

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    try {
      const workflow = await getWorkflowStatus();
      
      if (!workflow) {
        console.log('⚠️  No workflow runs found');
        await sleep(CHECK_INTERVAL);
        continue;
      }

      const status = `${workflow.status} - ${workflow.conclusion || 'in_progress'}`;
      
      if (status !== lastStatus) {
        console.log(`📊 Status: ${workflow.status}`);
        if (workflow.conclusion) {
          console.log(`📋 Result: ${workflow.conclusion}`);
        }
        console.log(`🔗 URL: ${workflow.url}\n`);
        lastStatus = status;
      }

      // Check if deployment is complete
      if (workflow.status === 'completed') {
        if (workflow.conclusion === 'success') {
          console.log('✅ Deployment completed successfully!\n');
          return true;
        } else {
          console.log(`❌ Deployment failed with status: ${workflow.conclusion}\n`);
          return false;
        }
      }

      // Still in progress
      process.stdout.write('.');
      await sleep(CHECK_INTERVAL);

    } catch (error) {
      console.error('⚠️  Error checking workflow status:', error.message);
      await sleep(CHECK_INTERVAL);
    }
  }

  console.log('\n⏰ Timeout waiting for deployment\n');
  return false;
}

/**
 * Run live deployment tests
 */
function runLiveTests() {
  console.log('\n🧪 Running Live Deployment Tests');
  console.log('==================================\n');

  try {
    execSync('npx playwright test tests/e2e/live-deployment-test.spec.ts --config=playwright.production.config.ts', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('\n✅ All tests passed!\n');
    return true;
  } catch (error) {
    console.log('\n⚠️  Some tests failed. Check the report for details.\n');
    return false;
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log('Step 1: Monitoring deployment...\n');
  
  const deploymentSuccess = await waitForDeployment();
  
  if (!deploymentSuccess) {
    console.log('❌ Deployment did not complete successfully.');
    console.log('Please check the GitHub Actions logs and try again.\n');
    process.exit(1);
  }

  // Wait a bit for CDN/cache to update
  console.log('⏳ Waiting 30 seconds for deployment to propagate...\n');
  await sleep(30000);

  console.log('Step 2: Running live tests...\n');
  
  const testsSuccess = runLiveTests();
  
  if (testsSuccess) {
    console.log('🎉 Deployment and testing complete!');
    console.log('✅ Live site is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Deployment complete but tests found issues.');
    console.log('📊 Check the test report for details.\n');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
