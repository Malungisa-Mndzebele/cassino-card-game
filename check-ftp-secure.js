/**
 * Secure FTP Connection Test Script
 * Uses environment variables for credentials
 */

const ftp = require('basic-ftp');
const { getFtpConfig } = require('./ftp-config');

async function checkFTPConnection() {
  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log('🔐 Loading FTP configuration from environment variables...');
    const config = getFtpConfig();
    
    console.log(`📡 Testing connection to ${config.host}...`);
    await client.access(config);
    
    console.log('✅ Connection successful!');
    console.log('📂 Current directory:', await client.pwd());
    
    // List files in current directory
    console.log('\n📋 Files in current directory:');
    const list = await client.list();
    list.forEach(item => {
      const type = item.isDirectory ? '📁' : '📄';
      console.log(`${type} ${item.name}`);
    });
    
    // Try to navigate to target directory
    const targetDir = '/public_html/cassino';
    console.log(`\n📁 Checking target directory: ${targetDir}`);
    try {
      await client.cd(targetDir);
      console.log('✅ Target directory exists and is accessible');
      
      console.log('\n📋 Files in target directory:');
      const targetList = await client.list();
      targetList.forEach(item => {
        const type = item.isDirectory ? '📁' : '📄';
        console.log(`${type} ${item.name}`);
      });
    } catch (err) {
      console.log('⚠️  Target directory not accessible:', err.message);
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run connection test
checkFTPConnection();
