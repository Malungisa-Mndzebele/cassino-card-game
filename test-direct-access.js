/**
 * Test direct access to production site with cache busting
 */

const https = require('https');

function testURL(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n🔍 Testing Production Site Access\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 1: Main page
  console.log('1️⃣  Testing: https://khasinogaming.com/cassino/');
  const mainPage = await testURL('https://khasinogaming.com/cassino/');
  console.log(`   Status: ${mainPage.statusCode}`);
  console.log(`   Content-Type: ${mainPage.headers['content-type']}`);
  
  if (mainPage.body.includes('Casino Card Game')) {
    console.log('   ✅ Shows Casino Card Game!');
  } else if (mainPage.body.includes('Khasino Gaming')) {
    console.log('   ❌ Shows Khasino Gaming (cached)');
  } else {
    console.log('   ❓ Unknown content');
  }

  // Test 2: With cache buster
  console.log('\n2️⃣  Testing: https://khasinogaming.com/cassino/?v=' + Date.now());
  const cacheBust = await testURL('https://khasinogaming.com/cassino/?v=' + Date.now());
  console.log(`   Status: ${cacheBust.statusCode}`);
  
  if (cacheBust.body.includes('Casino Card Game')) {
    console.log('   ✅ Shows Casino Card Game!');
  } else if (cacheBust.body.includes('Khasino Gaming')) {
    console.log('   ❌ Still shows Khasino Gaming');
  }

  // Test 3: Direct asset access
  console.log('\n3️⃣  Testing: https://khasinogaming.com/cassino/assets/index-DQHDQFLl.js');
  try {
    const asset = await testURL('https://khasinogaming.com/cassino/assets/index-DQHDQFLl.js');
    console.log(`   Status: ${asset.statusCode}`);
    if (asset.statusCode === 200) {
      console.log('   ✅ JavaScript file is accessible!');
      console.log(`   Size: ${asset.body.length} bytes`);
    } else {
      console.log('   ❌ JavaScript file not found');
    }
  } catch (err) {
    console.log('   ❌ Error accessing JavaScript file');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

runTests().catch(console.error);
