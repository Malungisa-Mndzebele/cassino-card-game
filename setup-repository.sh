#!/bin/bash

# KhasinoGaming Repository Setup Script
# This script helps set up the repository for the Cassino card game

echo "🎮 KhasinoGaming - Cassino Card Game Repository Setup"
echo "===================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git first.${NC}"
    exit 1
fi

# Check if we're already in a git repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git repository already exists.${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}⏹️  Setup cancelled.${NC}"
        exit 0
    fi
else
    echo -e "${BLUE}📁 Initializing Git repository...${NC}"
    git init
fi

# Set up git configuration (if not already set)
if [ -z "$(git config user.name)" ]; then
    echo ""
    echo -e "${BLUE}👤 Git user configuration:${NC}"
    read -p "Enter your name: " USER_NAME
    read -p "Enter your email: " USER_EMAIL
    
    git config user.name "$USER_NAME"
    git config user.email "$USER_EMAIL"
    
    echo -e "${GREEN}✅ Git user configured${NC}"
fi

# Add all files to git
echo ""
echo -e "${BLUE}📦 Adding files to repository...${NC}"
git add .

# Create initial commit
echo -e "${BLUE}📝 Creating initial commit...${NC}"
git commit -m "Initial commit: Cassino Card Game for KhasinoGaming

Features:
- Complete Cassino card game implementation
- Real-time multiplayer with Supabase
- Sound effects and game statistics
- Hints system and responsive design
- Production-ready deployment configuration
- Comprehensive documentation

Ready for deployment to khasinogaming.com"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Initial commit created${NC}"
else
    echo -e "${YELLOW}⚠️  No changes to commit (files may already be committed)${NC}"
fi

# Display repository status
echo ""
echo -e "${BLUE}📊 Repository Status:${NC}"
git status --short
echo ""

# Show repository information
echo -e "${BLUE}📁 Repository Information:${NC}"
echo "Working directory: $(pwd)"
echo "Git repository: $(git rev-parse --git-dir 2>/dev/null || echo 'Not a git repository')"
echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'No commits yet')"
echo "Total commits: $(git rev-list --count HEAD 2>/dev/null || echo '0')"
echo ""

# Instructions for GitHub/remote setup
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo ""
echo -e "${BLUE}To push to GitHub:${NC}"
echo "1. Create a new repository on GitHub"
echo "2. Run these commands:"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/yourusername/cassino-card-game.git"
echo "   git push -u origin main"
echo ""

echo -e "${BLUE}To deploy to KhasinoGaming.com:${NC}"
echo "1. Run: ./deploy-khasinogaming.sh"
echo "2. Upload the generated files to your hosting service"
echo "3. Follow the HOSTING_GUIDE.md for detailed instructions"
echo ""

echo -e "${BLUE}Project Structure:${NC}"
echo "📁 Repository Contents:"
find . -type f -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.sh" | grep -v node_modules | grep -v .git | head -20
if [ $(find . -type f | grep -v node_modules | grep -v .git | wc -l) -gt 20 ]; then
    echo "   ... and $(expr $(find . -type f | grep -v node_modules | grep -v .git | wc -l) - 20) more files"
fi
echo ""

echo -e "${GREEN}🎊 Repository setup complete!${NC}"
echo -e "${GREEN}   Your Cassino card game repository is ready! 🎮${NC}"
echo ""
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo "• Update /utils/supabase/info.tsx with your production keys"
echo "• Deploy your Supabase edge function"
echo "• Test the game thoroughly before going live"
echo ""