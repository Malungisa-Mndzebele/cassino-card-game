const ftp = require('basic-ftp');
const fs = require('fs');

async function downloadIndex() {
  const client = new ftp.Client();

  try {
    await client.access({
      host: 'server28.shared.spaceship.host',
      user: 'cassino@khasinogaming.com',
      password: '@QWERTYasd',
      secure: false
    });

    console.log('📥 Downloading /cassino/index.html...\n');
    await client.downloadTo('downloaded-index.html', '/cassino/index.html');
    
    const content = fs.readFileSync('downloaded-index.html', 'utf8');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 Content of /cassino/index.html:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(content);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (content.includes('Casino Card Game')) {
      console.log('✅ File contains "Casino Card Game" - Correct app!');
    } else if (content.includes('Khasino Gaming')) {
      console.log('❌ File contains "Khasino Gaming" - Wrong app!');
    } else {
      console.log('⚠️  Cannot determine which app this is');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.close();
  }
}

downloadIndex();
