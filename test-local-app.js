// Quick local application test
const http = require('http');

console.log('🧪 Testing Casino Card Game Application Locally\n');

// Test 1: Backend Health Check
function testBackendHealth() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣  Testing backend health endpoint...');
    http.get('http://localhost:8000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'healthy') {
            console.log('   ✅ Backend is healthy');
            console.log(`   📊 Status: ${json.status}`);
            console.log(`   💾 Database: ${json.database}\n`);
            resolve(true);
          } else {
            console.log('   ❌ Backend unhealthy\n');
            resolve(false);
          }
        } catch (e) {
          console.log('   ❌ Invalid response\n');
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log(`   ❌ Backend not responding: ${e.message}\n`);
      resolve(false);
    });
  });
}

// Test 2: Create Room
function testCreateRoom() {
  return new Promise((resolve, reject) => {
    console.log('2️⃣  Testing room creation...');
    const postData = JSON.stringify({ player_name: 'TestPlayer1' });
    
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/rooms/create',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.room_id && json.player_id) {
            console.log('   ✅ Room created successfully');
            console.log(`   🎲 Room ID: ${json.room_id}`);
            console.log(`   👤 Player ID: ${json.player_id}\n`);
            resolve({ success: true, roomId: json.room_id, playerId: json.player_id });
          } else {
            console.log('   ❌ Invalid room creation response\n');
            resolve({ success: false });
          }
        } catch (e) {
          console.log(`   ❌ Error parsing response: ${e.message}\n`);
          resolve({ success: false });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ Request failed: ${e.message}\n`);
      resolve({ success: false });
    });

    req.write(postData);
    req.end();
  });
}

// Test 3: Frontend Accessibility
function testFrontend() {
  return new Promise((resolve, reject) => {
    console.log('3️⃣  Testing frontend accessibility...');
    http.get('http://localhost:5173/cassino/', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Frontend is accessible');
        console.log(`   📄 Status Code: ${res.statusCode}\n`);
        resolve(true);
      } else {
        console.log(`   ❌ Frontend returned status ${res.statusCode}\n`);
        resolve(false);
      }
    }).on('error', (e) => {
      console.log(`   ❌ Frontend not responding: ${e.message}\n`);
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════\n');
  
  const healthOk = await testBackendHealth();
  const roomResult = await testCreateRoom();
  const frontendOk = await testFrontend();
  
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 Test Summary:');
  console.log(`   Backend Health: ${healthOk ? '✅' : '❌'}`);
  console.log(`   Room Creation: ${roomResult.success ? '✅' : '❌'}`);
  console.log(`   Frontend Access: ${frontendOk ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  if (healthOk && roomResult.success && frontendOk) {
    console.log('🎉 All tests passed! Application is running correctly.');
    console.log('\n🌐 Access the application at: http://localhost:5173/cassino/');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
  }
}

runTests();
