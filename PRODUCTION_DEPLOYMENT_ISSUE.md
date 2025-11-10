# Production Deployment Issue Report

**Date:** November 9, 2025  
**Status:** 🔴 **CRITICAL - Wrong Application Deployed**

## Problem Summary

The production URL https://khasinogaming.com/cassino/ is **NOT** showing the Casino Card Game application. Instead, it displays a different "Khasino Gaming" landing page.

## Evidence

### What We Expected
- Casino Card Game application
- Room creation/joining interface
- Test IDs: `room-manager`, `create-room-test`, `join-room-test`, etc.

### What We Found
- **Page Title:** "Khasino Gaming - Your Ultimate Gaming Destination"
- **Content:** 3,930 characters of different content
- **No Casino Card Game elements:**
  - ❌ No "Casino Card Game" text
  - ❌ No Room Manager component
  - ❌ No Create/Join buttons
  - ❌ No input fields for player name or room code

### Test Results
```
🔍 App Presence Indicators:
  ❌ Casino Card Game text
  ❌ Room Manager
  ❌ Create button
  ❌ Join button
  ❌ Name input

❌ Casino Card Game app NOT found
```

## Deployment Configuration

### GitHub Actions Workflow
- **File:** `.github/workflows/deploy-frontend.yml`
- **Trigger:** Push to `master` branch with changes to frontend files
- **Build:** `npm run build` → creates `dist/` folder
- **Deploy:** FTP to `khasinogaming.com` using `SamKirkland/FTP-Deploy-Action`
- **Target:** `server-dir: /` (deploys to root of FTP account)

### Expected URLs
- **Frontend:** https://khasinogaming.com/cassino/
- **Backend API:** https://cassino-game-backend.fly.dev
- **WebSocket:** wss://cassino-game-backend.fly.dev

## Possible Causes

### 1. Wrong FTP Directory
The FTP deployment might be uploading to the wrong directory:
- Current: `server-dir: /`
- Should be: `server-dir: /cassino/` or `/public_html/cassino/`

### 2. Multiple index.html Files
There might be multiple index.html files, and the wrong one is being served:
- Casino Card Game: `/cassino/index.html` (our app)
- Khasino Gaming: `/index.html` or `/cassino/index.html` (different site)

### 3. Server Configuration
The web server might be configured to serve a different directory or have URL rewriting rules that interfere.

### 4. Deployment Not Running
The GitHub Actions workflow might not be triggering or failing silently.

## Investigation Steps

### 1. Check GitHub Actions
```bash
# Visit: https://github.com/Malungisa-Mndzebele/cassino-card-game/actions
# Look for: "Deploy Frontend to khasinogaming.com"
# Check: Latest run status and logs
```

### 2. Verify FTP Deployment
The workflow uses these secrets:
- `FTP_HOST` - FTP server address
- `FTP_USERNAME` - Should be `cassino@khasinogaming.com`
- `FTP_PASSWORD` - FTP password

Check if files are being uploaded to the correct location.

### 3. Check Server File Structure
SSH into the server to see actual file structure:
```bash
ssh cassino@khasinogaming.com
cd /home/mawdqtvped/khasinogaming.com/cassino
ls -la
cat index.html | head -20  # Check which app this is
```

### 4. Test Direct File Access
Try accessing specific files to see if they exist:
```bash
curl -I https://khasinogaming.com/cassino/index.html
curl -I https://khasinogaming.com/cassino/assets/index-*.js
```

## Recommended Fixes

### Option 1: Fix FTP Directory (Most Likely)
Update `.github/workflows/deploy-frontend.yml`:
```yaml
- name: Deploy to khasinogaming.com via FTP
  uses: SamKirkland/FTP-Deploy-Action@4.3.3
  with:
    server: ${{ secrets.FTP_HOST }}
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./dist/
    server-dir: /cassino/  # ← Add this to deploy to /cassino/ subdirectory
```

### Option 2: Check .htaccess
Ensure there's a `.htaccess` file in the `/cassino/` directory:
```apache
RewriteEngine On
RewriteBase /cassino/
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

### Option 3: Manual Deployment Verification
1. SSH into server
2. Navigate to `/home/mawdqtvped/khasinogaming.com/cassino`
3. Check if our built files are there
4. If not, manually upload `dist/` contents to correct location

## Current Status

✅ **Completed:**
- Fixed test selectors to match actual component
- Updated tests to use correct test IDs
- Created production verification tests
- Pushed changes to trigger deployment

⏳ **In Progress:**
- GitHub Actions deployment should be running now
- Commit: `d5438f2` - "Fix live deployment tests and verify production site"

❌ **Blocked:**
- Cannot run live deployment tests until correct app is deployed
- Need to verify FTP deployment configuration
- May need server access to investigate file structure

## Next Steps

1. **Monitor GitHub Actions** (5-10 minutes)
   - Check if deployment completes successfully
   - Review deployment logs for errors

2. **Re-run Production Check** (after deployment)
   ```bash
   npx playwright test tests/e2e/production-basic-check.spec.ts --config=playwright.production.config.ts
   ```

3. **If Still Wrong Site:**
   - Check FTP configuration
   - Verify server-dir setting
   - May need to SSH into server to investigate

4. **Once Correct App is Deployed:**
   - Run full live deployment test suite
   - Verify all functionality works in production

## Contact/Access Needed

If the issue persists, may need:
- SSH access to server
- FTP credentials to verify upload location
- cPanel/hosting panel access to check configuration
- GitHub repository admin access to check secrets

---

**Screenshot:** `test-results/production-site-screenshot.png` shows what's currently deployed
