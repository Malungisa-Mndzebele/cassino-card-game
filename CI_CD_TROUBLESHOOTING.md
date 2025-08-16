# 🔧 CI/CD Troubleshooting Guide

## ❌ If CI is Failing

The most common reason for CI failure is missing FTP credentials. Here's how to fix it:

### 🔑 **Step 1: Get Your FTP Credentials from Spaceship**

1. **Log into your Spaceship hosting account**
2. **Go to Hosting → Manage khasinogaming.com**
3. **Find FTP credentials** (usually in cPanel or hosting settings)
4. **Note down:**
   - FTP Host (e.g., `khasinogaming.com` - without ftp. prefix)
   - FTP Username (e.g., `githubactions@khasinogaming.com`)
   - FTP Password

### 🔐 **Step 2: Add GitHub Secrets**

1. **Go to your repository**: https://github.com/Malungisa-Mndzebele/cassino-card-game
2. **Click Settings** (top menu)
3. **Click Secrets and variables → Actions** (left sidebar)
4. **Click "New repository secret"**
5. **Add these 3 secrets:**

| Secret Name | Value |
|-------------|-------|
| `FTP_HOST` | Your FTP host (e.g., `khasinogaming.com`) |
| `FTP_USERNAME` | Your FTP username (e.g., `githubactions@khasinogaming.com`) |
| `FTP_PASSWORD` | Your FTP password |

### ✅ **Step 3: Test the CI/CD**

1. **Make a small change** to any file (like adding a comment)
2. **Commit and push** to trigger the workflow
3. **Check the Actions tab** to see if it succeeds

---

## 🚀 **What the CI/CD Does**

### **Build Job:**
- ✅ Installs dependencies
- ✅ Builds the production version
- ✅ Creates optimized files

### **Deploy Job:**
- ✅ Downloads build artifacts
- ✅ Creates deployment package
- ✅ Uploads to your website via FTP
- ✅ Adds performance optimizations

---

## 🔍 **Common Issues & Solutions**

### **Issue: "FTP credentials not configured"**
**Solution:** Add the 3 secrets above to your repository

### **Issue: "Build failed"**
**Solution:** Check the build logs for specific errors

### **Issue: "FTP connection failed"**
**Solution:** 
- Verify FTP credentials are correct
- Check if FTP is enabled on your hosting
- Try connecting with an FTP client first

### **Issue: "Permission denied"**
**Solution:** 
- Check file permissions on your hosting
- Ensure the FTP user has write access to `/home/mawdqtvped/khasinogaming.com/cassino/`

---

## 📞 **Need Help?**

If you're still having issues:

1. **Check the Actions tab** in your GitHub repository for detailed error logs
2. **Contact Spaceship support** for FTP credential help
3. **Verify your hosting path** is correct: `/home/mawdqtvped/khasinogaming.com/cassino/`

---

## 🎯 **Expected Result**

Once configured correctly, every time you push to the `master` branch:
- ✅ Code builds automatically
- ✅ Game deploys to https://khasinogaming.com/cassino/
- ✅ No manual upload needed
- ✅ Flickering issues are fixed

**Your game will be automatically updated whenever you make changes!** 🎮✨
