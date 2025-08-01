# 🚀 KhasinoGaming.com Deployment Guide

## Deploying Cassino Card Game to Your Web Hosting

This guide is specifically for deploying to your **khasinogaming.com** hosting service.

## 📋 Pre-Deployment Checklist

- [x] Supabase project created and configured
- [x] Game files built and ready
- [x] Domain HTTPS enabled
- [ ] Production Supabase keys updated
- [ ] Files uploaded to hosting service
- [ ] Edge function deployed
- [ ] Game tested in production

## 🔧 Step 1: Configure Production Environment

### 1.1 Update Supabase Configuration

1. **Go to your Supabase project dashboard**
2. **Copy your production keys** from Settings > API:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon public key: `eyJhbGciOiJIUzI1NiIsInR5cCI6...`

3. **Update `/utils/supabase/info.tsx`**:
   ```typescript
   export const projectId = 'your-actual-project-id'  // Replace this!
   export const publicAnonKey = 'your-actual-anon-key'  // Replace this!
   ```

### 1.2 Deploy Supabase Edge Function

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project ID)
supabase link --project-ref your-project-id

# Deploy the server function
supabase functions deploy server --project-ref your-project-id

# Verify deployment
supabase functions list
```

## 🏗️ Step 2: Build Production Version

```bash
# Install dependencies
npm install

# Create production build
npm run build
```

This creates a `dist/` folder with your production files.

## 📁 Step 3: Upload to KhasinoGaming.com

### Option A: Upload to Subdirectory (Recommended)

1. **Access your hosting control panel**
2. **Navigate to File Manager** or use FTP
3. **Go to `public_html` directory**
4. **Create a new folder** called `cassino`
5. **Upload all contents** of the `dist/` folder to `public_html/cassino/`

**Your game will be available at:** `https://khasinogaming.com/cassino/`

### Option B: Upload to Root Domain

1. **Upload all contents** of `dist/` folder to `public_html/`
2. **Rename existing `index.html`** if you have one (backup first!)

**Your game will be available at:** `https://khasinogaming.com/`

### File Structure After Upload:
```
public_html/cassino/          (or public_html/ for root)
├── index.html               # Main game file
├── assets/
│   ├── index-[hash].js     # JavaScript bundle
│   ├── index-[hash].css    # Styles
│   └── ...
├── manifest.json           # PWA manifest
├── favicon.ico            # Favicon
└── (other generated files)
```

## 🔐 Step 4: Configure HTTPS & Security

### 4.1 Verify HTTPS is Working
- Visit: `https://khasinogaming.com/cassino/`
- Ensure the lock icon appears (secure connection)
- **HTTPS is required** for Supabase to work properly

### 4.2 Configure CORS (if needed)
If you get CORS errors, add these headers to your `.htaccess` file:

```apache
# Add to public_html/.htaccess (or public_html/cassino/.htaccess)
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header set Access-Control-Allow-Headers "Authorization, Content-Type"
```

## 🧪 Step 5: Test Your Deployment

### 5.1 Basic Functionality Test
1. **Visit your game URL**
2. **Create a new room** - should work without errors
3. **Check browser console** - no JavaScript errors
4. **Test on mobile** - responsive design working

### 5.2 Multiplayer Test
1. **Open game in two different browsers** (or incognito mode)
2. **Player 1 creates room**
3. **Player 2 joins with room code**
4. **Play a complete game** - test all features
5. **Verify real-time updates** work properly

### 5.3 Feature Testing Checklist
- [ ] Room creation and joining
- [ ] Card shuffling and dealing
- [ ] Card playing (capture, build, trail)
- [ ] Sound effects (if enabled)
- [ ] Hints system
- [ ] Game statistics
- [ ] Score calculation
- [ ] Game completion

## 🚨 Troubleshooting Common Issues

### ❌ "Failed to load game" or blank screen
**Solution:**
- Check browser console for errors
- Verify all files uploaded correctly
- Ensure `index.html` is in the correct location

### ❌ "Supabase connection failed"
**Solution:**
- Double-check your project ID and anon key in `/utils/supabase/info.tsx`
- Verify edge function is deployed: `supabase functions list`
- Ensure your Supabase project is active

### ❌ "CORS policy" errors
**Solution:**
- Verify your site uses HTTPS
- Add CORS headers to `.htaccess` (see above)
- Check Supabase project CORS settings

### ❌ "Cannot join room" or "Room not found"
**Solution:**
- Check Supabase edge function logs: `supabase functions logs server`
- Verify the function URL is accessible
- Test edge function directly in browser

### ❌ Cards or images not loading
**Solution:**
- Check file paths are correct (relative paths)
- Verify all asset files were uploaded
- Check browser network tab for 404 errors

## 📈 Step 6: Performance Optimization

### 6.1 Enable Compression (if available)
Add to `.htaccess`:
```apache
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
```

### 6.2 Set Cache Headers
```apache
# Cache static assets
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
```

## 🎯 Step 7: SEO & Marketing Setup

### 7.1 Submit to Search Engines
- **Google Search Console**: Submit your sitemap
- **Bing Webmaster Tools**: Register your site
- Update your site's main navigation to include the game

### 7.2 Social Media Setup
- **Facebook**: Test Open Graph tags with Facebook Debugger
- **Twitter**: Test Twitter Card with Card Validator
- **Share links** on your social media accounts

## 📊 Step 8: Monitoring & Analytics

### 8.1 Add Analytics (Optional)
1. **Get Google Analytics tracking ID**
2. **Add to `index.html`** (uncomment the analytics section)
3. **Set up conversion goals** for game completions

### 8.2 Monitor Performance
- **Supabase Dashboard**: Monitor function calls and database usage
- **Hosting Panel**: Check bandwidth and storage usage
- **Browser Tools**: Monitor page load times

## 🎊 You're Live!

Your Cassino card game is now live at:
- **Primary URL**: `https://khasinogaming.com/cassino/`
- **Share URL**: Send this link to players

### 📣 Promote Your Game
- Add to your website's main menu
- Share on social media
- Add to game directories
- Include in your website's sitemap

## 🆘 Need Help?

If you run into issues:

1. **Check the troubleshooting section** above
2. **View browser console** for error messages  
3. **Check Supabase logs**: `supabase functions logs server`
4. **Test with different browsers/devices**

**Common URLs to test:**
- Game URL: `https://khasinogaming.com/cassino/`
- Edge Function: `https://your-project-id.supabase.co/functions/v1/make-server-48645a41/health`

---

**🎮 Congratulations!** Your Cassino card game is now live and ready for players worldwide to enjoy!