# Cassino Card Game - Deployment Guide

## 🚀 Publishing Your Game

This guide will help you deploy your Cassino card game to your existing website.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ A Convex account with a project set up
- ✅ Your hosting service credentials (FTP, cPanel, etc.)
- ✅ Node.js installed locally for building

## 🔧 Step 1: Convex Production Setup

### 1.1 Create/Configure Your Convex Project

1. Go to [convex.dev](https://convex.dev) and create a new project (or use existing)
2. Note down your project details:
   - **Project URL**: Found in your Convex dashboard
   - **Deployment URL**: Found in your Convex dashboard

### 1.2 Deploy Your Functions

1. Install Convex CLI:
   ```bash
   npm install -g convex
   ```

2. Login to Convex:
   ```bash
   npx convex login
   ```

3. Deploy your functions:
   ```bash
   npx convex deploy
   ```

### 1.3 Set Environment Variables in Convex

In your Convex dashboard, configure your environment variables as needed for your game functions.

## 🔧 Step 2: Configure Your Application

### 2.1 Update Convex Configuration

Update your Convex configuration with your production values:

```typescript
// In your convex.json or environment variables
export const CONVEX_URL = 'your-actual-convex-url'
```

### 2.2 Create Production Build

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build for production:
   ```bash
   npm run build
   ```

This creates a `dist` folder with your production files.

## 🌐 Step 3: Upload to Your Website

### Option A: Upload to Root Domain
Upload contents of `dist` folder to your website's root directory:
- `yourwebsite.com/` → Game loads at main domain

### Option B: Upload to Subdirectory  
Create a folder (e.g., `cassino`) and upload there:
- `yourwebsite.com/cassino/` → Game loads at subdirectory

### Files to Upload:
```
📁 Your website directory
  📄 index.html
  📁 assets/
    📄 index-[hash].js
    📄 index-[hash].css
  📁 (other generated files)
```

## 🔧 Step 4: Configure Your Hosting

### For cPanel/Shared Hosting:
1. Use File Manager or FTP client
2. Upload to `public_html` folder
3. Ensure `index.html` is in the correct location

### For Custom Server:
1. Configure web server (Apache/Nginx) to serve static files
2. Set up HTTPS (required for Convex)
3. Configure proper MIME types for `.js` and `.css` files

## 🛡️ Step 5: Security & Performance

### 5.1 HTTPS Configuration
- ✅ Ensure your website uses HTTPS (required for Convex)
- ✅ Update any HTTP links to HTTPS

### 5.2 CORS Configuration (if needed)
If you encounter CORS issues, add these headers to your server:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

## 🧪 Step 6: Testing Your Deployment

1. **Visit your game URL**
2. **Test creating a room**
3. **Test joining a room** (open in incognito/different browser)
4. **Play a complete game**
5. **Test all features** (hints, sound, statistics)

### Common Issues & Solutions:

❌ **"Failed to load Convex"**
- ✅ Check your Convex URL and configuration
- ✅ Verify Convex project is active

❌ **"CORS Error"**  
- ✅ Ensure your website uses HTTPS
- ✅ Check Convex CORS settings

❌ **"Convex function not found"**
- ✅ Verify functions are deployed: `npx convex list`
- ✅ Check function name matches your code

❌ **"Cards not loading"**
- ✅ Check browser console for JavaScript errors
- ✅ Verify all files uploaded correctly

## 📈 Step 7: Post-Launch Optimization

### 7.1 Monitor Performance
- Use browser dev tools to check load times
- Monitor Convex usage in dashboard

### 7.2 SEO & Sharing
Add to your `index.html` head section:
```html
<meta property="og:title" content="Cassino Card Game">
<meta property="og:description" content="Play the classic Cassino card game online with friends!">
<meta property="og:url" content="https://yourwebsite.com/cassino">
<meta name="description" content="Free online Cassino card game. Challenge friends to this classic card game with real-time multiplayer.">
```

## 🎯 Quick Deployment Checklist

- [ ] Convex project created and configured
- [ ] Functions deployed successfully
- [ ] Environment variables set in Convex
- [ ] Production build created (`npm run build`)
- [ ] Files uploaded to hosting service
- [ ] HTTPS enabled on your domain
- [ ] Game tested in production environment
- [ ] Multiple players tested simultaneously

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** for error messages
2. **Check Convex logs** in your dashboard
3. **Verify all files uploaded** correctly
4. **Test with different browsers/devices**

## 🎊 You're Live!

Once deployed, share your game:
- `https://yourwebsite.com/cassino` (or your chosen path)
- Players can create rooms and invite friends
- No registration required - just enter names and play!

---

**🎮 Happy Gaming!** Your Cassino card game is now live and ready for players worldwide.