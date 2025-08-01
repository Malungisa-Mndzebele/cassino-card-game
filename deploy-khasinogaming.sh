#!/bin/bash

# KhasinoGaming.com Deployment Script for Cassino Card Game
# This script prepares your game for deployment to khasinogaming.com

echo "🎮 KhasinoGaming.com - Cassino Card Game Deployment"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root directory.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment checklist:${NC}"
echo "   1. Have you updated /utils/supabase/info.tsx with your production keys?"
echo "   2. Have you deployed your Supabase edge function?"
echo "   3. Is HTTPS enabled on khasinogaming.com?"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️  Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔨 Building production version...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build completed successfully!${NC}"

# Create a deployment package
echo ""
echo -e "${BLUE}📦 Creating deployment package...${NC}"

# Create a deployment folder
DEPLOY_DIR="cassino-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy built files
cp -r dist/* "$DEPLOY_DIR/"

# Copy documentation
cp README.md "$DEPLOY_DIR/" 2>/dev/null || echo "README.md not found, skipping..."
cp HOSTING_GUIDE.md "$DEPLOY_DIR/" 2>/dev/null || echo "HOSTING_GUIDE.md not found, skipping..."
cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/" 2>/dev/null || echo "DEPLOYMENT_GUIDE.md not found, skipping..."

# Create upload instructions
cat > "$DEPLOY_DIR/UPLOAD_INSTRUCTIONS.txt" << EOF
KhasinoGaming.com Upload Instructions
====================================

1. Access your hosting control panel
2. Go to File Manager (or use FTP client)
3. Navigate to public_html directory
4. Create a folder called 'cassino' (or upload to root)
5. Upload ALL files from this folder to public_html/cassino/

Your game will be available at:
https://khasinogaming.com/cassino/

Files in this package:
$(ls -la)

Important:
- Ensure HTTPS is enabled
- Test the game after upload
- Check browser console for any errors

Need help? See HOSTING_GUIDE.md for detailed instructions.
EOF

# Create .htaccess file for optimization
cat > "$DEPLOY_DIR/.htaccess" << EOF
# KhasinoGaming.com - Cassino Card Game Configuration

# Enable CORS for Supabase
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Authorization, Content-Type"

# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Set cache headers for better performance
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Redirect HTTP to HTTPS (if needed)
# RewriteEngine On
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
EOF

echo ""
echo -e "${GREEN}✅ Deployment package created: $DEPLOY_DIR${NC}"
echo ""

# Show file listing
echo -e "${BLUE}📁 Files ready for upload:${NC}"
ls -la "$DEPLOY_DIR/"
echo ""

# Calculate package size
PACKAGE_SIZE=$(du -sh "$DEPLOY_DIR" | cut -f1)
echo -e "${BLUE}📊 Package size: $PACKAGE_SIZE${NC}"
echo ""

# Final instructions
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo "1. Upload the contents of '$DEPLOY_DIR' to your web server"
echo "2. For subdirectory: Upload to public_html/cassino/"
echo "3. For root domain: Upload to public_html/"
echo "4. Test your game at: https://khasinogaming.com/cassino/"
echo ""

echo -e "${YELLOW}⚠️  Important Reminders:${NC}"
echo "• Make sure HTTPS is enabled on your domain"
echo "• Check that your Supabase edge function is deployed"
echo "• Verify your production keys are configured"
echo "• Test the game thoroughly after upload"
echo ""

echo -e "${BLUE}📖 For detailed instructions, see:${NC}"
echo "• HOSTING_GUIDE.md - Specific hosting instructions"
echo "• DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo "• UPLOAD_INSTRUCTIONS.txt - Quick upload guide"
echo ""

echo -e "${GREEN}🎊 Your Cassino card game is ready for deployment!${NC}"
echo -e "${GREEN}   Good luck with your launch on KhasinoGaming.com! 🎮${NC}"
EOF

# Make the script executable
chmod +x deploy-khasinogaming.sh