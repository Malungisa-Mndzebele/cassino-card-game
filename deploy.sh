#!/bin/bash

# Cassino Card Game Deployment Script
# This script helps automate the deployment process

echo "🎮 Cassino Card Game Deployment Script"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🔨 Building production version..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""
echo "📁 Your production files are ready in the 'dist' folder"
echo ""
echo "🚀 Next steps:"
echo "1. Upload the contents of the 'dist' folder to your web server"
echo "2. Make sure your Supabase project is configured"
echo "3. Update /utils/supabase/info.tsx with your production keys"
echo "4. Deploy your edge function with: supabase functions deploy server"
echo ""
echo "📋 Files to upload:"
ls -la dist/
echo ""
echo "🎊 Happy deploying!"