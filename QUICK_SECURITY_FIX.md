# Quick Security Fix - TL;DR

## 🚨 Your FTP password was exposed on GitHub!

### Immediate Actions (5 minutes):

```bash
# 1. Change your FTP password NOW at your hosting provider!
#    Host: server28.shared.spaceship.host
#    User: cassino@khasinogaming.com
#    Old password: @QWERTYasd (COMPROMISED - CHANGE IT!)

# 2. Install dependencies
npm install dotenv basic-ftp --save-dev

# 3. Create .env file
copy .env.example .env

# 4. Edit .env with your NEW password
notepad .env

# 5. Delete sensitive files
node cleanup-sensitive-files.js

# 6. Test new setup
node check-ftp-secure.js

# 7. Commit fixes
git add .
git commit -m "security: remove hardcoded credentials"
git push
```

### Critical Follow-up (10 minutes):

Remove credentials from git history:

```bash
pip install git-filter-repo
git filter-repo --path deploy-ftp.js --invert-paths
git filter-repo --path deploy-ftp-simple.js --invert-paths
git filter-repo --path download-index.js --invert-paths
git filter-repo --path check-ftp.js --invert-paths
git filter-repo --path check-ftp-files.js --invert-paths
git filter-repo --path check-parent-ftp.js --invert-paths
git filter-repo --path check-current-ftp.js --invert-paths
git filter-repo --path deploy-ftp.ps1 --invert-paths
git push origin --force --all
```

### Future Deployments:

```bash
npm run build
node deploy-secure.js
```

**See SECURITY_REMEDIATION_STEPS.md for detailed instructions.**
