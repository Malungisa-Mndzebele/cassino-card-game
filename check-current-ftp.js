const ftp = require('basic-ftp');

async function checkFiles() {
  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    console.log('\n🔍 Checking FTP directory contents...\n');

    await client.access({
      host: 'server28.shared.spaceship.host',
      user: 'cassino@khasinogaming.com',
      password: '@QWERTYasd',
      secure: false
    });

    console.log('✅ Connected to FTP server\n');

    // List root directory
    console.log('📁 Root directory (/)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const rootFiles = await client.list('/');
    rootFiles.forEach(file => {
      const type = file.isDirectory ? '📁' : '📄';
      console.log(`${type} ${file.name} (${file.size} bytes)`);
    });

    // Check if there's an index.html in root
    const indexFile = rootFiles.find(f => f.name === 'index.html');
    
    if (indexFile) {
      console.log('\n📄 Downloading /index.html to check content...');
      await client.downloadTo('temp-index.html', '/index.html');
      const fs = require('fs');
      const content = fs.readFileSync('temp-index.html', 'utf8');
      const titleMatch = content.match(/<title>(.*?)<\/title>/);
      if (titleMatch) {
        console.log(`   Title: "${titleMatch[1]}"`);
      }
      fs.unlinkSync('temp-index.html');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.close();
  }
}

checkFiles();
