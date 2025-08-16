# ⚡ Quick CI/CD Setup for KhasinoGaming.com

## 🎯 What This Does
Automatically deploy your Cassino card game to https://khasinogaming.com/cassino/ whenever you push code to GitHub.

---

## 🚀 Quick Setup (5 Minutes)

### 1. Get FTP Details from Spaceship Hosting
- **FTP Host**: (e.g., `ftp.khasinogaming.com`)
- **Username**: Your hosting username
- **Password**: Your hosting password

### 2. Add GitHub Secrets
In your GitHub repository → Settings → Secrets and variables → Actions:

| Secret Name | Value |
|-------------|-------|
| `FTP_HOST` | Your FTP host |
| `FTP_USERNAME` | Your username |
| `FTP_PASSWORD` | Your password |

### 3. Push to GitHub
```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

### 4. Watch Magic Happen! ✨
- GitHub Actions will build and deploy automatically
- Your game goes live at https://khasinogaming.com/cassino/

---

## 📁 Files Created

✅ `.github/workflows/deploy.yml` - GitHub Actions workflow  
✅ `scripts/deploy-to-khasinogaming.sh` - Local deployment script  
✅ `CI_CD_SETUP_GUIDE.md` - Complete setup guide  

---

## 🧪 Test Options

### Option A: Push to GitHub (Automatic)
```bash
git push origin main  # Triggers auto-deployment
```

### Option B: Manual GitHub Action
1. Go to Actions tab in GitHub
2. Click "Deploy to KhasinoGaming.com"
3. Click "Run workflow"

### Option C: Local Script
```bash
./scripts/deploy-to-khasinogaming.sh
```

---

## 🎮 Live URLs

- **Production**: https://khasinogaming.com/cassino/
- **GitHub Actions**: [Your Repo] → Actions tab
- **FTP Directory**: `/public_html/cassino/`

---

## 🆘 Issues?

1. **Check GitHub Actions logs** for errors
2. **Verify FTP credentials** in GitHub Secrets
3. **See CI_CD_SETUP_GUIDE.md** for detailed troubleshooting

---

**🎊 You're all set! Happy automated deployments!**
