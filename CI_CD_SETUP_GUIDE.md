# 🚀 CI/CD Setup Guide for KhasinoGaming.com

## Automated Deployment from GitHub to Your Website

This guide will help you set up automatic deployment of your Cassino card game from GitHub to khasinogaming.com using GitHub Actions.

---

## 📋 Prerequisites

Before setting up CI/CD, ensure you have:

- ✅ **GitHub Repository** for your project
- ✅ **Spaceship Hosting Account** with khasinogaming.com
- ✅ **FTP Access** to your hosting account
- ✅ **Node.js 18+** installed locally (for testing)

---

## 🔧 Step 1: Get Your FTP Credentials

### From Spaceship Hosting Dashboard:

1. **Log into your Spaceship hosting account**
2. **Navigate to Hosting > Manage**
3. **Find FTP/SFTP details:**
   - **FTP Host**: Usually something like `ftp.khasinogaming.com` or an IP address
   - **FTP Username**: Your hosting username
   - **FTP Password**: Your hosting password
   - **Directory**: `/public_html/` (we'll deploy to `/public_html/cassino/`)

### Write down these details:
```
FTP_HOST: ___________________
FTP_USERNAME: _______________
FTP_PASSWORD: _______________
```

---

## 🔐 Step 2: Set Up GitHub Secrets

### In Your GitHub Repository:

1. **Go to your repository on GitHub**
2. **Click Settings** (in the repository menu)
3. **Click Secrets and variables > Actions**
4. **Click "New repository secret"**
5. **Add these three secrets:**

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `FTP_HOST` | Your FTP host | e.g., `ftp.khasinogaming.com` |
| `FTP_USERNAME` | Your FTP username | Your hosting username |
| `FTP_PASSWORD` | Your FTP password | Your hosting password |

### Adding Each Secret:
- Click **"New repository secret"**
- Enter **Name** (e.g., `FTP_HOST`)
- Enter **Secret** (the actual value)
- Click **"Add secret"**
- Repeat for all three secrets

---

## 📂 Step 3: Repository Structure

Your repository should have this structure:
```
your-repository/
├── .github/
│   └── workflows/
│       └── deploy.yml          # ✅ Already created
├── scripts/
│   └── deploy-to-khasinogaming.sh  # ✅ Already created
├── components/
├── convex/
├── package.json
├── App.tsx
└── ... (other project files)
```

**✅ The GitHub Actions workflow (`.github/workflows/deploy.yml`) is already set up!**

---

## 🚀 Step 4: How It Works

### Automatic Deployment Triggers:

1. **Push to main/master branch** → Automatic deployment
2. **Manual deployment** → Use "Actions" tab in GitHub
3. **Pull requests** → Build only (no deployment)

### Deployment Process:

1. **GitHub detects push** to main branch
2. **Installs dependencies** (`npm ci --legacy-peer-deps`)
3. **Builds the application** (`npm run build`)
4. **Creates deployment package** with optimizations
5. **Deploys via FTP** to `/public_html/cassino/`
6. **Your game goes live** at `https://khasinogaming.com/cassino/`

---

## 🧪 Step 5: Test the Setup

### Option A: Automatic Test (Push to GitHub)

1. **Make a small change** to your code
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Test CI/CD deployment"
   git push origin main
   ```
3. **Watch the deployment** in GitHub Actions tab
4. **Check your website** at `https://khasinogaming.com/cassino/`

### Option B: Manual Test (Local Script)

1. **Run the local deployment script:**
   ```bash
   ./scripts/deploy-to-khasinogaming.sh
   ```
2. **Upload the generated folder** manually to test

### Option C: Manual GitHub Action

1. **Go to Actions tab** in your GitHub repository
2. **Click "Deploy to KhasinoGaming.com"**
3. **Click "Run workflow"**
4. **Choose branch** and click "Run workflow"

---

## 📊 Step 6: Monitor Deployments

### In GitHub Actions:

1. **Go to Actions tab** in your repository
2. **Click on any workflow run** to see details
3. **Monitor build and deployment logs**
4. **Check for any errors**

### Deployment Info:

Each deployment creates a `DEPLOYMENT_INFO.txt` file with:
- Deployment timestamp
- Git commit hash
- GitHub user who triggered it
- Workflow details

---

## 🛠️ Customization Options

### Change Deployment Directory:

In `.github/workflows/deploy.yml`, modify:
```yaml
server-dir: /public_html/cassino/  # Change this path
```

### Change Deployment Triggers:

```yaml
on:
  push:
    branches: [ main ]  # Add or remove branches
```

### Add Environment Variables:

Add to the workflow under `env:`:
```yaml
env:
  NODE_VERSION: '18'
  CUSTOM_VAR: 'value'
```

---

## 🚨 Troubleshooting

### Common Issues:

#### ❌ **"FTP connection failed"**
**Solution:**
- Check FTP credentials in GitHub Secrets
- Verify FTP host is correct
- Ensure FTP access is enabled in hosting

#### ❌ **"Build failed"**
**Solution:**
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Run `npm run build` locally to test

#### ❌ **"Permission denied"**
**Solution:**
- Check FTP username/password
- Verify directory permissions
- Ensure `/public_html/cassino/` exists

#### ❌ **"Website not updating"**
**Solution:**
- Clear browser cache
- Check deployment logs in GitHub Actions
- Verify files were uploaded via FTP

### Debug Steps:

1. **Check GitHub Actions logs** for detailed error messages
2. **Test local build**: Run `npm run build` locally
3. **Test FTP connection**: Use an FTP client to connect manually
4. **Check file permissions** on your hosting account

---

## 🎯 Best Practices

### Development Workflow:

1. **Create feature branch**: `git checkout -b feature-name`
2. **Make changes** and test locally
3. **Create pull request** to main (triggers build test)
4. **Merge to main** (triggers deployment)
5. **Check live site** at `https://khasinogaming.com/cassino/`

### Security:

- ✅ **Never commit FTP credentials** to your repository
- ✅ **Use GitHub Secrets** for sensitive information
- ✅ **Review deployment logs** regularly
- ✅ **Use HTTPS** for your website

### Performance:

- ✅ **Automatic compression** enabled via .htaccess
- ✅ **Browser caching** configured
- ✅ **Optimized builds** with Vite
- ✅ **Asset minification** included

---

## 📈 Advanced Features

### Staging Environment:

Add a staging branch for testing:
```yaml
# In .github/workflows/deploy.yml
- name: Deploy to staging
  if: github.ref == 'refs/heads/staging'
  # Deploy to different directory
```

### Rollback Strategy:

Keep previous deployments:
```bash
# In your FTP directory
/public_html/
├── cassino/           # Current version
├── cassino-backup/    # Previous version
└── cassino-v1.0/      # Tagged version
```

### Notifications:

Add Slack/Discord notifications:
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: custom
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎊 Success!

Once set up, your deployment workflow will be:

1. **Code changes** → Push to GitHub
2. **Automatic build** → GitHub Actions
3. **Live website** → https://khasinogaming.com/cassino/

**No manual uploads needed!** 🚀

---

## 🆘 Need Help?

### Resources:

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Spaceship Hosting Support**: Contact your hosting provider
- **FTP Troubleshooting**: Check hosting control panel

### Quick Contact:

If you need help setting this up, you can:
1. Check the **GitHub Actions logs** for specific error messages
2. Test the **local deployment script** first
3. Verify **FTP credentials** work with an FTP client
4. Contact **Spaceship hosting support** for server-side issues

---

**🎮 Happy automated gaming deployments!**