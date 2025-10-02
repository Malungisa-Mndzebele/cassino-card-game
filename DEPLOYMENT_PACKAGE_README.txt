================================================================================
CASINO CARD GAME - SPACESHIP SERVER DEPLOYMENT PACKAGE
================================================================================

This file contains instructions for deploying your Casino Card Game backend
to your Spaceship hosting server.

DATABASE CREDENTIALS:
--------------------
Host: localhost (when on the server)
Database: mawdqtvped_cassino
User: mawdqtvped_cassino_user
Password: @QWERTYasd

SERVER DETAILS:
--------------
FTP Server: server28.shared.spaceship.host
FTP Port: 21
FTP Username: cassino@khasinogaming.com
FTP Password: @QWERTYasd
Server Path: /home/mawdqtvped/khasinogaming.com/cassino

QUICK START DEPLOYMENT:
----------------------

1. UPLOAD FILES:
   - Use FTP client (FileZilla, WinSCP, etc.)
   - Connect to: server28.shared.spaceship.host:21
   - Username: cassino@khasinogaming.com
   - Upload entire 'backend' folder to: /home/mawdqtvped/khasinogaming.com/cassino/

2. SSH INTO SERVER:
   ssh cassino@khasinogaming.com
   (If SSH not available, use cPanel Terminal)

3. RUN DEPLOYMENT SCRIPT:
   cd /home/mawdqtvped/khasinogaming.com/cassino
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

