# 📤 FTP Upload Guide for Spaceship Hosting

## Connection Details

| Setting | Value |
|---------|-------|
| **Protocol** | FTP or FTPS |
| **Host** | [See your hosting credentials] |
| **Port** | 21 (FTP) or 21 (FTPS Explicit) |
| **Username** | [Your FTP username] |
| **Password** | [Your FTP password] |
| **Target Directory** | [Your server path] |

## Recommended FTP Clients

### FileZilla (Windows/Mac/Linux)
1. Download from: https://filezilla-project.org/
2. Open FileZilla
3. Fill in connection details:
   - Host: `[Your FTP host]`
   - Username: `[Your FTP username]`
   - Password: `[Your FTP password]`
   - Port: `21`
4. Click "Quickconnect"

### WinSCP (Windows)
1. Download from: https://winscp.net/
2. New Session → FTP
3. Fill in connection details
4. Click "Login"

### Command Line (Linux/Mac)
```bash
# Using lftp
lftp -u [FTP_USERNAME],[FTP_PASSWORD] [FTP_HOST]

# Upload directory
mirror -R backend/ [SERVER_PATH]/
```

## Files to Upload

Upload the **entire backend folder** with these files:

### ✅ Required Files
```
backend/
├── main.py                    # Main FastAPI application
├── database.py                # Database configuration
├── models.py                  # Database models
├── schemas.py                 # Pydantic schemas
├── game_logic.py              # Game logic
├── requirements.txt           # Python dependencies
├── .env.production            # Production config (rename to .env)
├── alembic.ini                # Migration config
├── alembic/                   # Migration folder
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       ├── __init__.py
│       ├── 0001_initial_migration.py
│       └── 71619fc3c108_add_ip_address_to_players.py
├── deploy_to_spaceship.sh     # Deployment script
├── start_server.sh            # Server start script
├── start_production.py        # Production server
├── test_db_connection.py      # DB connection test
├── .htaccess                  # Apache proxy config
└── SPACESHIP_DEPLOYMENT.md    # Full documentation
```

### ❌ Do NOT Upload
- `venv/` - Virtual environment (create on server)
- `__pycache__/` - Python cache (auto-generated)
- `.env` - Local environment file (use .env.production on server)
- `*.db` - SQLite database files (using MySQL on server)
- `test_*.py` - Test files (optional)
- `.pyc` files - Compiled Python files

## Step-by-Step Upload Process

### Using FileZilla

1. **Connect to Server**
   ```
   File → Site Manager → New Site
   Protocol: FTP
   Host: server28.shared.spaceship.host
   Port: 21
   Logon Type: Normal
   User: cassino@khasinogaming.com
   Password: @QWERTYasd
   ```

2. **Navigate to Target Directory**
   - On the right panel (server side), navigate to:
   ```
   /home/mawdqtvped/khasinogaming.com/cassino
   ```
   - If the folder doesn't exist, right-click → Create Directory

3. **Select Files to Upload**
   - Left panel: Navigate to your local `backend` folder
   - Select all required files (see list above)
   - Drag and drop to the right panel
   - Or right-click → Upload

4. **Verify Upload**
   - Check all files uploaded successfully
   - Verify file sizes match

5. **Set Permissions** (Important!)
   - Right-click on `.sh` files
   - File Attributes → Set to `755` (rwxr-xr-x)
   - For `.sh` files:
     - `deploy_to_spaceship.sh` → 755
     - `start_server.sh` → 755

### Using WinSCP

1. **Connect**
   ```
   New Session → FTP
   Host name: server28.shared.spaceship.host
   Port number: 21
   User name: cassino@khasinogaming.com
   Password: @QWERTYasd
   ```

2. **Upload**
   - Navigate to `/home/mawdqtvped/khasinogaming.com/cassino`
   - Drag backend folder from left to right
   - Click "OK" to start upload

3. **Set Permissions**
   - Select `.sh` files
   - Properties → Permissions → 0755

## After Upload

### 1. Rename Environment File
The `.env.production` file needs to be renamed to `.env`:

**Via FTP:**
- Right-click `.env.production` → Rename → `.env`

**Via SSH:**
```bash
cd /home/mawdqtvped/khasinogaming.com/cassino
mv .env.production .env
```

### 2. Verify Files
SSH into the server and check:

```bash
ssh cassino@khasinogaming.com
cd /home/mawdqtvped/khasinogaming.com/cassino
ls -la

# You should see all uploaded files
```

### 3. Check File Permissions
```bash
# Check script permissions
ls -l *.sh

# Should show: -rwxr-xr-x (755)
# If not, fix with:
chmod +x deploy_to_spaceship.sh
chmod +x start_server.sh
```

## Troubleshooting

### Connection Refused
- Check server address is correct
- Verify port 21 is open
- Try FTPS (Explicit TLS) if FTP fails
- Check firewall settings

### Authentication Failed
- Verify username: `cassino@khasinogaming.com`
- Verify password: `@QWERTYasd`
- Check if account is active in Spaceship cPanel

### Permission Denied
- Verify you're uploading to correct directory
- Check you have write permissions
- Contact Spaceship support if needed

### Upload Stalls/Fails
- Use Active mode instead of Passive
- Try FTPS instead of FTP
- Upload in smaller batches
- Check internet connection

### Files Not Showing
- Refresh directory listing
- Check "Show hidden files" option
- Verify correct path
- May need to restart FTP client

## Next Steps

After successful upload, see:
1. **backend/SPACESHIP_DEPLOYMENT.md** - Full deployment guide
2. **backend/DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist

Run deployment:
```bash
ssh cassino@khasinogaming.com
cd /home/mawdqtvped/khasinogaming.com/cassino
./deploy_to_spaceship.sh
```

## Quick Reference

```bash
# Connect via SSH after FTP upload
ssh cassino@khasinogaming.com

# Navigate to directory
cd /home/mawdqtvped/khasinogaming.com/cassino

# Make scripts executable
chmod +x *.sh

# Rename config file
mv .env.production .env

# Run deployment
./deploy_to_spaceship.sh

# Start server
./start_server.sh
```

