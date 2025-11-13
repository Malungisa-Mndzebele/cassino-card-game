const ftp = require('basic-ftp');

async function checkFiles() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log('\n🔍 Checking FTP directory structure...\n');

    await client.access({
      host: 'server28.shared.spaceship.host',
      user: 'cassino@khasinogaming.com',
      password: '@QWERTYasd',
      secure: false
    });

    console.log('✅ Connected to FTP server\n');

    // Check current directory
    console.log('📁 Current directory:');
    const pwd = await client.pwd();
    console.log(`   ${pwd}\n`);

    // Try to go up one level
    try {
      await client.cdup();
      const parentPwd = await client.pwd();
      console.log('📁 Parent directory:');
      console.log(`   ${parentPwd}\n`);
      
      const parentFiles = await client.list();
      console.log('Files in parent:');
      parentFiles.forEach(file => {
        const type = file.isDirectory ? '📁' : '📄';
        console.log(`  ${type} ${file.name}`);
      });

      // Check if there's a cassino folder
      const cassinoFolder = parentFiles.find(f => f.name === 'cassino' && f.isDirectory);
      if (cassinoFolder) {
        console.log('\n✅ Found /cassino folder in parent directory');
        console.log('   This means FTP root (/) is actually the parent of /cassino/');
      }
    } catch (err) {
      console.log('ℹ️  Cannot access parent directory (already at root)');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.close();
  }
}

checkFiles();
