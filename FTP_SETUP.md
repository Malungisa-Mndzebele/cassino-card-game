# 🚀 FTP Deployment Setup Guide

## Your Server Details:
- **FTP Server**: `[YOUR_FTP_HOST]`
- **FTP Username**: `[YOUR_FTP_USERNAME]`
- **FTP Password**: `[YOUR_FTP_PASSWORD]`
- **FTP Port**: 21
- **Path**: `[YOUR_SERVER_PATH]/cassino`

## 🔐 Setting up GitHub Secret

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add this secret:
   - **Name**: `FTP_PASSWORD`
   - **Value**: `[YOUR_FTP_PASSWORD]`

## 🔄 How the Deployment Works

1. When you push to `master`, GitHub Actions will:
   - Run tests
   - Prepare deployment files
   - Upload files via FTP
   - Set up PHP wrapper for backend
   - Configure .htaccess for routing

2. The deployment creates:
   - Frontend files in root directory
   - Backend files in `/backend` directory
   - PHP wrapper to proxy requests to Python backend
   - .htaccess for proper routing

## 📋 Files Structure After Deployment

```
/home/mawdqtvped/khasinogaming.com/cassino/
├── index.html
├── manifest.json
├── favicon.svg
├── .htaccess
├── public/
├── frontend/
└── backend/
    ├── start.php
    ├── start_production.py
    └── ... other backend files
```

## ✅ Verifying Deployment

Your game will be available at:
https://khasinogaming.com/cassino/

## 🔍 Troubleshooting

If deployment fails:
1. Check GitHub Actions logs
2. Verify FTP credentials
3. Check file permissions on server
4. Look for PHP errors in server logs

## 📞 Need Help?

1. Check cPanel error logs
2. Contact Spaceship hosting support
3. Open GitHub issue
