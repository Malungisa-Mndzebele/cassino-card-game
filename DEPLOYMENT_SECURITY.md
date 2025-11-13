# Secure Deployment Configuration

## ⚠️ SECURITY NOTICE

**CRITICAL:** FTP credentials were previously exposed in the repository. If you haven't already:

1. **Change your FTP password immediately** at your hosting provider
2. **Review access logs** for any unauthorized access
3. **Never commit credentials** to version control

## Setup Instructions

### 1. Install Dependencies

```bash
npm install dotenv basic-ftp
```

### 2. Create Environment File

Copy the example environment file:

```bash
copy .env.example .env
```

### 3. Configure Credentials

Edit `.env` and add your actual FTP credentials:

```env
FTP_HOST=server28.shared.spaceship.host
FTP_USER=cassino@khasinogaming.com
FTP_PASSWORD=your-new-secure-password
FTP_PORT=21
FTP_SECURE=false
```

**Important:** The `.env` file is already in `.gitignore` and will NOT be committed to git.

## Usage

### Test FTP Connection

```bash
node check-ftp-secure.js
```

### Deploy to Production

```bash
# Build the project first
npm run build

# Deploy to FTP
node deploy-secure.js
```

## Security Best Practices

1. ✅ **Use environment variables** for all sensitive data
2. ✅ **Never commit** `.env` files to version control
3. ✅ **Use strong passwords** with mixed characters
4. ✅ **Rotate credentials** regularly
5. ✅ **Use SFTP/FTPS** when possible (set `FTP_SECURE=true`)
6. ✅ **Limit FTP access** to specific IP addresses if possible
7. ✅ **Review `.gitignore`** before committing

## Files to Delete

The following files contain hardcoded credentials and should be deleted:

- `deploy-ftp.js`
- `deploy-ftp-simple.js`
- `download-index.js`
- `check-ftp.js`
- `check-ftp-files.js`
- `check-parent-ftp.js`
- `check-current-ftp.js`
- `deploy-ftp.ps1`

These files are now in `.gitignore` to prevent future commits.

## Removing Sensitive Data from Git History

To completely remove the exposed credentials from git history:

```bash
# Install git-filter-repo (recommended method)
pip install git-filter-repo

# Remove files from history
git filter-repo --path deploy-ftp.js --invert-paths
git filter-repo --path deploy-ftp-simple.js --invert-paths
git filter-repo --path download-index.js --invert-paths
git filter-repo --path check-ftp.js --invert-paths
git filter-repo --path check-ftp-files.js --invert-paths
git filter-repo --path check-parent-ftp.js --invert-paths
git filter-repo --path check-current-ftp.js --invert-paths
git filter-repo --path deploy-ftp.ps1 --invert-paths

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
```

**Alternative using BFG Repo-Cleaner:**

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files deploy-ftp.js
java -jar bfg.jar --delete-files deploy-ftp-simple.js
# ... repeat for other files

git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

## New Secure Files

- `ftp-config.js` - Centralized FTP configuration loader
- `deploy-secure.js` - Secure deployment script
- `check-ftp-secure.js` - Secure connection test script
- `.env.example` - Template for environment variables
- `.env` - Your actual credentials (NOT committed to git)

## Questions?

If you need help with the deployment process or security concerns, please contact your system administrator.
