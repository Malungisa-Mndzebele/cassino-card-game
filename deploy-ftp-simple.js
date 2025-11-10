const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('\n🚀 Starting FTP Deployment');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await client.access({
      host: 'server28.shared.spaceship.host',
      user: 'cassino@khasinogaming.com',
      password: '@QWERTYasd',
      secure: false
    });

    console.log('✅ Connected to FTP server\n');

    // Deploy to FTP root (which is already /cassino/ on the server)
    console.log('📁 Deploying to FTP root (maps to /cassino/ URL)...');
    await client.cd('/');
    
    console.log('📦 Uploading dist folder...\n');
    await client.uploadFromDir('./dist');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Deployment completed successfully!');
    console.log('🌐 Site: https://khasinogaming.com/cassino/\n');

  } catch (err) {
    console.error('❌ Deployment failed:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
