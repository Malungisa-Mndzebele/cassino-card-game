#!/bin/bash

# Deploy to KhasinoGaming.com - Local Script
# This script mirrors the GitHub Actions workflow for local testing

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "🎮 KhasinoGaming.com Deployment Script"
echo "======================================"
echo -e "${NC}"

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

echo -e "${BLUE}📋 Pre-deployment checks:${NC}"
echo "   ✓ Node.js version: $(node --version)"
echo "   ✓ npm version: $(npm --version)"
echo "   ✓ Project directory: $(pwd)"
echo ""

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci --legacy-peer-deps

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Build the application
echo ""
echo -e "${BLUE}🔨 Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Create deployment package
echo ""
echo -e "${BLUE}📦 Creating deployment package...${NC}"

# Create deployment directory with timestamp
DEPLOY_DIR="khasinogaming-deployment-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy built files
cp -r dist/* "$DEPLOY_DIR/"

# Copy documentation
cp README.md "$DEPLOY_DIR/" 2>/dev/null || echo "README.md not found, skipping..."
cp HOSTING_GUIDE.md "$DEPLOY_DIR/" 2>/dev/null || echo "HOSTING_GUIDE.md not found, skipping..."
cp DEPLOYMENT_GUIDE.md "$DEPLOY_DIR/" 2>/dev/null || echo "DEPLOYMENT_GUIDE.md not found, skipping..."

# Create .htaccess for performance
cat > "$DEPLOY_DIR/.htaccess" << 'EOF'
# KhasinoGaming.com - Cassino Card Game Configuration
# Auto-generated deployment configuration

# Enable CORS
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
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Set cache headers
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType application/json "access plus 1 week"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# PWA support
<IfModule mod_mime.c>
    AddType application/manifest+json .webmanifest
    AddType application/javascript .js
    AddType text/css .css
</IfModule>
EOF

# Create deployment info
cat > "$DEPLOY_DIR/DEPLOYMENT_INFO.txt" << EOF
KhasinoGaming.com Deployment Information
========================================

Deployed: $(date -u)
Local User: $(whoami)
Machine: $(hostname)
Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "Not a git repository")
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "Not a git repository")

This deployment was created using the local deployment script.
EOF

# Create upload instructions
cat > "$DEPLOY_DIR/UPLOAD_INSTRUCTIONS.txt" << EOF
Upload Instructions for KhasinoGaming.com
==========================================

1. Access your Spaceship hosting control panel
2. Navigate to File Manager
3. Go to public_html directory
4. Create or navigate to the 'cassino' folder
5. Upload ALL files from this directory to public_html/cassino/

Your game will be available at:
https://khasinogaming.com/cassino/

Files in this package:
$(ls -la "$DEPLOY_DIR")

Package size: $(du -sh "$DEPLOY_DIR" | cut -f1)
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

# Optional: FTP deployment if credentials are provided
if [ ! -z "$FTP_HOST" ] && [ ! -z "$FTP_USERNAME" ] && [ ! -z "$FTP_PASSWORD" ]; then
    echo -e "${YELLOW}🚀 FTP credentials detected. Attempting automatic deployment...${NC}"
    
    # Check if lftp is installed
    if command -v lftp &> /dev/null; then
        echo "Deploying via FTP..."
        lftp -c "
        set ssl:verify-certificate false;
        open -u $FTP_USERNAME,$FTP_PASSWORD $FTP_HOST;
        lcd $DEPLOY_DIR;
        cd /public_html/cassino;
        mirror -R --delete --verbose .;
        quit
        "
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Automatic FTP deployment completed!${NC}"
            echo -e "${GREEN}🎮 Your game should be live at: https://khasinogaming.com/cassino/${NC}"
        else
            echo -e "${YELLOW}⚠️  FTP deployment failed. Please upload manually.${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  lftp not installed. Skipping automatic FTP deployment.${NC}"
        echo "   Install lftp for automatic deployment: sudo apt-get install lftp"
    fi
else
    echo -e "${YELLOW}💡 For automatic FTP deployment, set environment variables:${NC}"
    echo "   export FTP_HOST=your-ftp-host"
    echo "   export FTP_USERNAME=your-username"
    echo "   export FTP_PASSWORD=your-password"
fi

echo ""
echo -e "${GREEN}🎊 Deployment package ready!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Upload the contents of '$DEPLOY_DIR' to your Spaceship hosting"
echo "2. Place files in: public_html/cassino/"
echo "3. Test your game at: https://khasinogaming.com/cassino/"
echo ""
echo -e "${PURPLE}🔧 For automated deployments, commit this to GitHub and it will auto-deploy!${NC}"
echo -e "${GREEN}   Happy gaming! 🎮${NC}"