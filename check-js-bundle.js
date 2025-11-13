const https = require('https');

async function checkBundle() {
  console.log('\n🔍 Checking JavaScript bundle...\n');
  
  const url = 'https://khasinogaming.com/cassino/assets/index-DRzwmgdK.js';
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📦 Bundle size: ${data.length} bytes\n`);
      
      // Check for title-related strings
      if (data.includes('Khasino Gaming')) {
        console.log('❌ Found "Khasino Gaming" in bundle!');
        const matches = data.match(/.{0,50}Khasino Gaming.{0,50}/g);
        if (matches) {
          matches.forEach(m => console.log(`   "${m}"`));
        }
      } else {
        console.log('✅ No "Khasino Gaming" found in bundle');
      }
      
      if (data.includes('Casino Card Game')) {
        console.log('✅ Found "Casino Card Game" in bundle');
      } else {
        console.log('❌ No "Casino Card Game" found in bundle');
      }
      
      if (data.includes('Cassino')) {
        console.log('✅ Found "Cassino" in bundle');
      }
    });
  }).on('error', (err) => {
    console.error('❌ Error:', err.message);
  });
}

checkBundle();
