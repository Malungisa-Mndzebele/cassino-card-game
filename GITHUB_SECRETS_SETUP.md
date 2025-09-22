# 🔐 GitHub Secrets Setup Guide

## 🚨 **URGENT: Missing GitHub Secrets**

Your deployment is failing because the required GitHub Secrets are not configured. Here's how to fix it:

## 📋 **Required Secrets**

You need to add these 4 secrets to your GitHub repository:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `HOST` | `khasinogaming.com` | Your server hostname |
| `USERNAME` | `cassino` | Your server username |
| `SSH_KEY` | `[Your private SSH key]` | Your private SSH key content |
| `PORT` | `22` | SSH port (usually 22) |

## 🔧 **Step-by-Step Setup**

### **1. Go to GitHub Repository Settings**
1. Navigate to: https://github.com/Malungisa-Mndzebele/cassino-card-game
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)

### **2. Add Each Secret**
Click **"New repository secret"** for each one:

#### **Secret 1: HOST**
- **Name**: `HOST`
- **Value**: `khasinogaming.com`

#### **Secret 2: USERNAME**
- **Name**: `USERNAME`
- **Value**: `cassino`

#### **Secret 3: SSH_KEY**
- **Name**: `SSH_KEY`
- **Value**: `[Your private SSH key content - see below]`

#### **Secret 4: PORT**
- **Name**: `PORT`
- **Value**: `22`

## 🔑 **How to Get Your SSH Key**

### **Option A: If you already have an SSH key**
```bash
# On your local machine, display your private key
cat ~/.ssh/id_rsa
# or
cat ~/.ssh/id_ed25519
```

### **Option B: Generate a new SSH key**
```bash
# Generate new SSH key
ssh-keygen -t rsa -b 4096 -C "cassino@khasinogaming.com"

# Save it as: ~/.ssh/khasinogaming_deploy

# Display the private key (copy this to GitHub Secret)
cat ~/.ssh/khasinogaming_deploy

# Copy the public key to your server
ssh-copy-id -i ~/.ssh/khasinogaming_deploy.pub cassino@khasinogaming.com
```

## 📝 **SSH Key Content Example**

Your SSH key should look like this (starts with `-----BEGIN` and ends with `-----END`):

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAv8... (many more lines)
-----END OPENSSH PRIVATE KEY-----
```

## ✅ **Verification Steps**

### **1. Test SSH Connection Locally**
```bash
# Test if you can connect to your server
ssh cassino@khasinogaming.com

# If successful, you should see a prompt like:
# cassino@khasinogaming.com:~$
```

### **2. Check GitHub Secrets**
1. Go to your repository → Settings → Secrets and variables → Actions
2. Verify all 4 secrets are listed:
   - ✅ HOST
   - ✅ USERNAME  
   - ✅ SSH_KEY
   - ✅ PORT

### **3. Trigger Deployment**
1. Make a small change to your repository
2. Push to `master` branch
3. Check GitHub Actions tab
4. Watch the deployment succeed!

## 🚨 **Troubleshooting**

### **If SSH connection fails:**
```bash
# Test with verbose output
ssh -v cassino@khasinogaming.com

# Check if key is loaded
ssh-add -l
```

### **If GitHub Actions still fails:**
1. Check the Actions tab for detailed error messages
2. Verify all secrets are exactly as shown above
3. Make sure there are no extra spaces in secret values

## 🎯 **Expected Result**

Once configured, every push to `master` will:
1. ✅ Run tests
2. ✅ Build the project
3. ✅ Deploy to khasinogaming.com
4. ✅ Start backend and frontend services
5. ✅ Make your game live at: https://khasinogaming.com/cassino/

## 📞 **Need Help?**

If you're still having issues:
1. Check the GitHub Actions logs for specific error messages
2. Verify your server is accessible: `ping khasinogaming.com`
3. Test SSH manually: `ssh cassino@khasinogaming.com`

---

**🎮 Your Casino Card Game will be live and auto-updating once these secrets are configured!**
