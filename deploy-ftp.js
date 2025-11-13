/**
 * FTP Deployment Script
 * Uploads dist/ folder to production server
 */

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'server28.shared.spaceship.host',
  user: 'cassino@khasinogaming.com',
  password: '@QWERTYasd',
  secure: false,
  port: 21
};

const remotePath = '/';  // Deploy to FTP root which maps to /cassino/ URL
const localPath = './dist';

async function deploy() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  
  try {
    console.log('\n🚀 Starting FTP Deployment');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📡 Connecting to FTP server...');
    await client.access(config);
    console.log('✅ Connected successfully!\n');
    
    console.log(`📂 Changing to remote directory: ${remotePath}`);
    await client.ensureDir(remotePath);
    console.log('✅ Directory ready\n');
    
    console.log('📦 Uploading files from dist/...');
    await client.uploadFromDir(localPath);
    console.log('\n✅ All files uploaded successfully!');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Deployment completed!');
    console.log('🌐 Site: https://khasinogaming.com/cassino/\n');
    
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
