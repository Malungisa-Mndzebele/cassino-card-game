/**
 * Secure FTP Configuration
 * Loads credentials from environment variables
 */

require('dotenv').config();

function getFtpConfig() {
  const requiredVars = ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please create a .env file based on .env.example'
    );
  }

  return {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || '21', 10),
    secure: process.env.FTP_SECURE === 'true'
  };
}

module.exports = { getFtpConfig };
