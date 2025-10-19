================================================================================
CASINO CARD GAME - SPACESHIP SERVER DEPLOYMENT PACKAGE
================================================================================

This file contains instructions for deploying your Casino Card Game backend
to your Spaceship hosting server.

DATABASE CREDENTIALS:
--------------------
Host: localhost (when on the server)
Database: [YOUR_DB_NAME]
User: [YOUR_DB_USER]
Password: [YOUR_DB_PASSWORD]

SERVER DETAILS:
--------------
FTP Server: [YOUR_FTP_HOST]
FTP Port: 21
FTP Username: [YOUR_FTP_USERNAME]
FTP Password: [YOUR_FTP_PASSWORD]
Server Path: [YOUR_SERVER_PATH]/cassino

QUICK START DEPLOYMENT:
----------------------

1. UPLOAD FILES:
   - Use FTP client (FileZilla, WinSCP, etc.)
   - Connect to: [YOUR_FTP_HOST]:21
   - Username: [YOUR_FTP_USERNAME]
   - Upload entire 'backend' folder to: [YOUR_SERVER_PATH]/cassino/

2. SSH INTO SERVER:
   ssh [YOUR_FTP_USERNAME]@[YOUR_FTP_HOST]
   (If SSH not available, use cPanel Terminal)

3. RUN DEPLOYMENT SCRIPT:
   cd [YOUR_SERVER_PATH]/cassino
   chmod +x deploy_to_spaceship.sh
   ./deploy_to_spaceship.sh

4. START THE SERVER:
   ./start_server.sh
   
   Or run in background:
   nohup python start_production.py > server.log 2>&1 &

5. TEST THE API:
   curl http://localhost:8000/health

IMPORTANT FILES:
---------------
✓ backend/SPACESHIP_DEPLOYMENT.md - Complete deployment guide
✓ backend/DEPLOYMENT_CHECKLIST.md - Step-by-step checklist
✓ backend/deploy_to_spaceship.sh - Automated deployment script
✓ backend/start_server.sh - Server startup script
✓ backend/.env.production - Production configuration (rename to .env on server)
✓ backend/test_db_connection.py - Database connection tester

TROUBLESHOOTING:
---------------
See backend/SPACESHIP_DEPLOYMENT.md for detailed troubleshooting steps.

Common issues:
- Python not found: Contact Spaceship to ensure Python 3.8+ is installed
- Database connection failed: Verify .env has correct credentials with localhost
- Port not accessible: Set up Apache reverse proxy using .htaccess
- Permission denied: Run: chmod -R 755 /home/mawdqtvped/khasinogaming.com/cassino

NEED HELP?
----------
1. Read: backend/SPACESHIP_DEPLOYMENT.md (full guide)
2. Check: backend/DEPLOYMENT_CHECKLIST.md (step-by-step)
3. Contact: Spaceship support for server issues

Good luck with your deployment!
================================================================================

