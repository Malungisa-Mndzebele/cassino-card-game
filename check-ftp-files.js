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
      console.log(`${type} ${file.name} (${file.size} bytes, modified: ${file.modifiedAt})`);
    });

    // List cassino directory
    console.log('\n📁 /cassino directory');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const cassinoFiles = await client.list('/cassino');
    cassinoFiles.forEach(file => {
      const type = file.isDirectory ? '📁' : '📄';
      console.log(`${type} ${file.name} (${file.size} bytes, modified: ${file.modifiedAt})`);
    });

    // Check if there's an index.html in root
    const hasRootIndex = rootFiles.some(f => f.name === 'index.html');
    const hasCassinoIndex = cassinoFiles.some(f => f.name === 'index.html');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Analysis:');
    console.log(`  index.html in root (/): ${hasRootIndex ? '✅ YES' : '❌ NO'}`);
    console.log(`  index.html in /cassino: ${hasCassinoIndex ? '✅ YES' : '❌ NO'}`);

    if (hasRootIndex) {
      console.log('\n⚠️  WARNING: There is an index.html in the root directory!');
      console.log('   This might be served instead of /cassino/index.html');
    }

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

checkFiles();
