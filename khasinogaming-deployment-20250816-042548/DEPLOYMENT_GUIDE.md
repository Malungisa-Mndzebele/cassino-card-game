# Cassino Card Game - Deployment Guide

## 🚀 Publishing Your Game

This guide will help you deploy your Cassino card game to your existing website.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ A Supabase account with a project set up
- ✅ Your hosting service credentials (FTP, cPanel, etc.)
- ✅ Node.js installed locally for building

## 🔧 Step 1: Supabase Production Setup

### 1.1 Create/Configure Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project (or use existing)
2. Note down your project details:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Public Key**: Found in Settings > API
   - **Service Role Key**: Found in Settings > API (keep this secret!)

### 1.2 Deploy Your Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Deploy your edge function:
   ```bash
   supabase functions deploy server --project-ref your-project-id
   ```

### 1.3 Set Environment Variables in Supabase

In your Supabase dashboard, go to Settings > Edge Functions and add these secrets:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_ANON_KEY`: Your anon public key  
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
- `SUPABASE_DB_URL`: Your database URL (found in Settings > Database)

## 🔧 Step 2: Configure Your Application

### 2.1 Update Supabase Info File

Update `/utils/supabase/info.tsx` with your production values:

```typescript
export const projectId = 'your-actual-project-id'
export const publicAnonKey = 'your-actual-anon-key'
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
2. Set up HTTPS (required for Supabase)
3. Configure proper MIME types for `.js` and `.css` files

## 🛡️ Step 5: Security & Performance

### 5.1 HTTPS Configuration
- ✅ Ensure your website uses HTTPS (required for Supabase)
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

❌ **"Failed to load Supabase"**
- ✅ Check your project ID and keys in `/utils/supabase/info.tsx`
- ✅ Verify Supabase project is active

❌ **"CORS Error"**  
- ✅ Ensure your website uses HTTPS
- ✅ Check Supabase CORS settings

❌ **"Edge function not found"**
- ✅ Verify edge function is deployed: `supabase functions list`
- ✅ Check function name matches your code

❌ **"Cards not loading"**
- ✅ Check browser console for JavaScript errors
- ✅ Verify all files uploaded correctly

## 📈 Step 7: Post-Launch Optimization

### 7.1 Monitor Performance
- Use browser dev tools to check load times
- Monitor Supabase usage in dashboard

### 7.2 SEO & Sharing
Add to your `index.html` head section:
```html
<meta property="og:title" content="Cassino Card Game">
<meta property="og:description" content="Play the classic Cassino card game online with friends!">
<meta property="og:url" content="https://yourwebsite.com/cassino">
<meta name="description" content="Free online Cassino card game. Challenge friends to this classic card game with real-time multiplayer.">
```

## 🎯 Quick Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Edge function deployed successfully
- [ ] Environment variables set in Supabase
- [ ] Production build created (`npm run build`)
- [ ] Files uploaded to hosting service
- [ ] HTTPS enabled on your domain
- [ ] Game tested in production environment
- [ ] Multiple players tested simultaneously

## 🆘 Need Help?

If you encounter issues:

1. **Check browser console** for error messages
2. **Check Supabase logs** in your dashboard
3. **Verify all files uploaded** correctly
4. **Test with different browsers/devices**

## 🎊 You're Live!

Once deployed, share your game:
- `https://yourwebsite.com/cassino` (or your chosen path)
- Players can create rooms and invite friends
- No registration required - just enter names and play!

---

**🎮 Happy Gaming!** Your Cassino card game is now live and ready for players worldwide.