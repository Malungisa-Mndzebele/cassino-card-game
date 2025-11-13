/**
 * Check FTP Directory Contents
 */

const ftp = require('basic-ftp');

const config = {
  host: 'server28.shared.spaceship.host',
  user: 'cassino@khasinogaming.com',
  password: '@QWERTYasd',
  secure: false,
  port: 21
};

async function checkDirectory() {
  const client = new ftp.Client();
  
  try {
    console.log('\n🔍 Checking FTP Directory Structure\n');
    
    await client.access(config);
    console.log('✅ Connected\n');
    
    // Check root
    console.log('📁 Root directory:');
    await client.cd('/');
    let list = await client.list();
    list.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));
    
    // Check khasinogaming.com
    console.log('\n📁 /khasinogaming.com:');
    await client.cd('/khasinogaming.com');
    list = await client.list();
    list.forEach(item => console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}`));
    
    // Check cassino
    console.log('\n📁 /khasinogaming.com/cassino:');
    await client.cd('/khasinogaming.com/cassino');
    list = await client.list();
    list.forEach(item => {
      const size = item.size ? ` (${(item.size / 1024).toFixed(2)} KB)` : '';
      console.log(`  ${item.isDirectory ? '📁' : '📄'} ${item.name}${size}`);
    });
    
    // Check if index.html exists and its size
    const indexFile = list.find(f => f.name === 'index.html');
    if (indexFile) {
      console.log(`\n✅ index.html found: ${(indexFile.size / 1024).toFixed(2)} KB`);
      console.log(`   Modified: ${indexFile.modifiedAt}`);
    } else {
      console.log('\n❌ index.html NOT FOUND!');
    }
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
  } finally {
    client.close();
  }
}

checkDirectory();
