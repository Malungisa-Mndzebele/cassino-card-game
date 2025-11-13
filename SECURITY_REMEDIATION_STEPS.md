# Security Remediation Steps

## 🚨 IMMEDIATE ACTION REQUIRED

Your FTP credentials were exposed in the GitHub repository. Follow these steps immediately:

## Step 1: Change FTP Password (DO THIS FIRST!)

1. Log into your hosting control panel at Spaceship
2. Navigate to FTP accounts
3. Change the password for `cassino@khasinogaming.com`
4. Use a strong password (16+ characters, mixed case, numbers, symbols)

## Step 2: Install Required Dependencies

```bash
npm install dotenv basic-ftp --save-dev
```

## Step 3: Set Up Secure Configuration

```bash
# Copy the environment template
copy .env.example .env

# Edit .env and add your NEW credentials
notepad .env
```

## Step 4: Clean Up Sensitive Files

```bash
# Run the cleanup script
node cleanup-sensitive-files.js

# Or manually delete these files:
del deploy-ftp.js
del deploy-ftp-simple.js
del download-index.js
del check-ftp.js
del check-ftp-files.js
del check-parent-ftp.js
del check-current-ftp.js
del deploy-ftp.ps1
```

## Step 5: Test New Secure Configuration

```bash
# Test FTP connection with new credentials
node check-ftp-secure.js
```

## Step 6: Commit Security Fixes

```bash
git add .
git commit -m "security: remove hardcoded credentials and implement secure config"
git push origin master
```

## Step 7: Remove from Git History (CRITICAL!)

The old credentials are still in git history. You MUST remove them:

### Option A: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove each sensitive file from history
git filter-repo --path deploy-ftp.js --invert-paths
git filter-repo --path deploy-ftp-simple.js --invert-paths
git filter-repo --path download-index.js --invert-paths
git filter-repo --path check-ftp.js --invert-paths
git filter-repo --path check-ftp-files.js --invert-paths
git filter-repo --path check-parent-ftp.js --invert-paths
git filter-repo --path check-current-ftp.js --invert-paths
git filter-repo --path deploy-ftp.ps1 --invert-paths

# Force push (this rewrites history)
git push origin --force --all
git push origin --force --tags
```

### Option B: Using BFG Repo-Cleaner

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
# Then run:

java -jar bfg.jar --delete-files "deploy-ftp.js"
java -jar bfg.jar --delete-files "deploy-ftp-simple.js"
java -jar bfg.jar --delete-files "download-index.js"
java -jar bfg.jar --delete-files "check-ftp*.js"
java -jar bfg.jar --delete-files "deploy-ftp.ps1"

git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

## Step 8: Verify Security

1. Check GitHub repository to ensure sensitive files are gone
2. Verify `.env` is NOT in the repository
3. Confirm `.gitignore` includes all sensitive files
4. Test deployment with new secure scripts

## Future Deployments

Use the new secure scripts:

```bash
# Build project
npm run build

# Deploy securely
node deploy-secure.js
```

## Files Created for Security

✅ `.env.example` - Template for credentials (safe to commit)
✅ `ftp-config.js` - Secure config loader (safe to commit)
✅ `deploy-secure.js` - Secure deployment script (safe to commit)
✅ `check-ftp-secure.js` - Secure connection test (safe to commit)
✅ `DEPLOYMENT_SECURITY.md` - Security documentation (safe to commit)
✅ `cleanup-sensitive-files.js` - Cleanup helper (safe to commit)
❌ `.env` - Your actual credentials (NEVER commit!)

## Checklist

- [ ] Changed FTP password
- [ ] Installed dotenv and basic-ftp
- [ ] Created .env file with new credentials
- [ ] Deleted files with hardcoded credentials
- [ ] Tested secure FTP connection
- [ ] Committed security fixes
- [ ] Removed sensitive files from git history
- [ ] Force pushed to GitHub
- [ ] Verified files are gone from GitHub
- [ ] Updated deployment documentation

## Questions?

If you need help with any of these steps, please ask before proceeding.

## Additional Security Recommendations

1. Enable two-factor authentication on GitHub
2. Use SSH keys instead of HTTPS for git operations
3. Consider using GitHub Secrets for CI/CD deployments
4. Enable SFTP/FTPS instead of plain FTP if your host supports it
5. Restrict FTP access by IP address if possible
6. Review who has access to your GitHub repository
7. Set up security alerts on GitHub
