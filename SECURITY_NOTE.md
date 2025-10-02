# 🔒 Security Notice

## Credentials Removed

All sensitive credentials have been removed from this repository for security purposes.

## Where to Add Your Credentials

### 1. GitHub Secrets (for CI/CD)
Go to: `https://github.com/[YOUR_USERNAME]/[YOUR_REPO]/settings/secrets/actions`

Add these secrets:
- `FTP_USERNAME` - Your FTP username
- `FTP_PASSWORD` - Your FTP password  
- `SSH_USERNAME` - Your SSH username (if applicable)
- `SSH_PASSWORD` - Your SSH password (if applicable)

### 2. Server .env File
On your server, create `/path/to/your/backend/.env`:

```env
DATABASE_URL=mysql+pymysql://[DB_USER]:[DB_PASSWORD]@localhost:3306/[DB_NAME]
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=production
CORS_ORIGINS=https://yourdomain.com
LOG_LEVEL=INFO
```

Replace placeholders with your actual credentials.

### 3. Documentation Files
Throughout the documentation, you'll see placeholders like:
- `[YOUR_FTP_HOST]`
- `[YOUR_FTP_USERNAME]` 
- `[YOUR_FTP_PASSWORD]`
- `[YOUR_SERVER_PATH]`
- `[YOUR_SSH_USERNAME]`
- `[YOUR_SERVER]`

Replace these with your actual values when using the commands.

## Important Security Practices

✅ **DO:**
- Keep `.env` files in `.gitignore`
- Use GitHub Secrets for CI/CD credentials
- Rotate passwords regularly
- Use strong, unique passwords
- Enable 2FA where available

❌ **DON'T:**
- Commit passwords or API keys to git
- Share credentials in plain text
- Use the same password across services
- Store credentials in documentation

## If Credentials Were Exposed

1. **Immediately change all passwords**
2. **Update GitHub Secrets** with new credentials  
3. **Update server `.env` file** with new database password
4. **Check git history** for any committed secrets
5. **Consider** using tools like `git-secrets` or `trufflehog`

## Contact

If you discover any exposed credentials in this repository, please report them immediately.

