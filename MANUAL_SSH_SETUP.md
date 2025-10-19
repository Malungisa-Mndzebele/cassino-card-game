# 🔐 Manual SSH Setup for GitHub Actions

## Your Server Information
- **Host**: `khasinogaming.com`
- **Username**: `cassino`
- **Path**: `/home/mawdqtvped/khasinogaming.com/cassino`
- **Password**: `[YOUR_FTP_PASSWORD]`

## 🚀 Quick Setup (3 Steps)

### Step 1: Generate SSH Key
```bash
ssh-keygen -t rsa -b 4096 -C "[YOUR_EMAIL]"
```
- Press Enter for default location
- Enter a passphrase (or press Enter for none)

### Step 2: Copy Public Key to Server
```bash
ssh-copy-id [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]
```
- Enter password: `[YOUR_FTP_PASSWORD]`

### Step 3: Add GitHub Secrets
Go to: https://github.com/Malungisa-Mndzebele/cassino-card-game/settings/secrets/actions

Add these 4 secrets:

| Secret Name | Value |
|-------------|-------|
| `HOST` | `khasinogaming.com` |
| `USERNAME` | `cassino` |
| `SSH_KEY` | `[Your private key content]` |
| `PORT` | `22` |

## 🔑 Get Your Private Key Content

```bash
# Display your private key (copy this to GitHub Secret SSH_KEY)
cat ~/.ssh/id_rsa
```

Your private key should look like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAv8... (many more lines)
-----END OPENSSH PRIVATE KEY-----
```

## ✅ Test Connection

```bash
# Test SSH connection
ssh [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]

# Should connect without asking for password
```

## 🎯 Deploy!

Once configured:
1. Push any change to `master` branch
2. GitHub Actions will automatically deploy
3. Your game will be live at: https://khasinogaming.com/cassino/

## 🚨 Troubleshooting

### If SSH connection fails:
```bash
# Test with verbose output
ssh -v cassino@khasinogaming.com

# Check if key is loaded
ssh-add -l
```

### If GitHub Actions still fails:
1. Check Actions tab for error messages
2. Verify all 4 secrets are added correctly
3. Make sure no extra spaces in secret values

---

**🎮 Your Casino Card Game will be live and auto-updating once these secrets are configured!**
