/**
 * Quick Production Health Check
 */

const https = require('https');

console.log('🏥 Production Health Check\n');

const checks = [
  {
    name: 'Backend Health',
    url: 'https://cassino-game-backend.fly.dev/health'
  },
  {
    name: 'Backend Root',
    url: 'https://cassino-game-backend.fly.dev/'
  },
  {
    name: 'Frontend',
    url: 'https://khasinogaming.com/cassino/'
  }
];

async function checkEndpoint(name, url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      const duration = Date.now() - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          name,
          url,
          status: res.statusCode,
          duration,
          success: res.statusCode >= 200 && res.statusCode < 400,
          response: data.substring(0, 200)
        });
      });
    }).on('error', (err) => {
      resolve({
        name,
        url,
        status: 0,
        duration: Date.now() - startTime,
        success: false,
        error: err.message
      });
    });
  });
}

async function runChecks() {
  for (const check of checks) {
    console.log(`\n📍 Checking: ${check.name}`);
    console.log(`   URL: ${check.url}`);
    
    const result = await checkEndpoint(check.name, check.url);
    
    if (result.success) {
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   ⏱️  Response time: ${result.duration}ms`);
      if (result.response) {
        console.log(`   📄 Response: ${result.response.substring(0, 100)}...`);
      }
    } else {
      console.log(`   ❌ Failed: ${result.error || `Status ${result.status}`}`);
    }
  }
  
  console.log('\n✅ Health check complete\n');
}

runChecks().catch(console.error);
