/**
 * Cleanup Script for Sensitive Files
 * Removes files with hardcoded credentials
 */

const fs = require('fs');
const path = require('path');

const sensitiveFiles = [
  'deploy-ftp.js',
  'deploy-ftp-simple.js',
  'download-index.js',
  'check-ftp.js',
  'check-ftp-files.js',
  'check-parent-ftp.js',
  'check-current-ftp.js',
  'deploy-ftp.ps1'
];

console.log('🧹 Cleaning up files with hardcoded credentials...\n');

let deletedCount = 0;
let notFoundCount = 0;

sensitiveFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted: ${file}`);
      deletedCount++;
    } catch (err) {
      console.error(`❌ Failed to delete ${file}:`, err.message);
    }
  } else {
    console.log(`⚠️  Not found: ${file}`);
    notFoundCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Deleted: ${deletedCount} files`);
console.log(`   Not found: ${notFoundCount} files`);

if (deletedCount > 0) {
  console.log('\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Change your FTP password immediately');
  console.log('2. Create .env file from .env.example');
  console.log('3. Add your new credentials to .env');
  console.log('4. Commit the changes: git add . && git commit -m "chore: remove files with hardcoded credentials"');
  console.log('5. Consider removing these files from git history (see DEPLOYMENT_SECURITY.md)');
}
