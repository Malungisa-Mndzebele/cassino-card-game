/**
 * Secure FTP Deployment Script
 * Uses environment variables for credentials
 */

const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const { getFtpConfig } = require('./ftp-config');

async function deployToFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('🔐 Loading FTP configuration from environment variables...');
    const config = getFtpConfig();
    
    console.log(`📡 Connecting to ${config.host}...`);
    await client.access(config);
    
    console.log('✅ Connected successfully!');
    console.log('📂 Current directory:', await client.pwd());
    
    // Navigate to the target directory
    const targetDir = '/public_html/cassino';
    console.log(`📁 Changing to directory: ${targetDir}`);
    await client.cd(targetDir);
    
    // Upload files
    const distPath = path.join(__dirname, 'dist');
    
    if (!fs.existsSync(distPath)) {
      throw new Error('dist folder not found. Please run "npm run build" first.');
    }
    
    console.log('📤 Uploading files from dist/...');
    await client.uploadFromDir(distPath);
    
    console.log('✅ Deployment completed successfully!');
    
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run deployment
deployToFTP();
