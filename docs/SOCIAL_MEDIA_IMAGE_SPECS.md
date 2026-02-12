# Social Media Image Specifications

## Required Images for SEO

### 1. Open Graph Image (og-image.png)

**Purpose**: Displayed when sharing on Facebook, LinkedIn, WhatsApp, and other platforms

**Specifications:**
- **Dimensions**: 1200 x 630 pixels (1.91:1 ratio)
- **Format**: PNG or JPG
- **File Size**: < 1MB (ideally < 300KB)
- **Location**: `public/og-image.png`

**Design Requirements:**
- Game title: "Casino Card Game"
- Subtitle: "Play Free Online with Friends"
- Screenshot or illustration of gameplay
- KhasinoGaming logo/branding
- High contrast colors for readability
- Text should be readable at small sizes
- Avoid placing important content in outer 10% (may be cropped)

**Content Suggestions:**
```
┌─────────────────────────────────────────┐
│                                         │
│         CASINO CARD GAME                │
│     Play Free Online with Friends       │
│                                         │
│    [Game Screenshot/Illustration]       │
│                                         │
│         🎴 Real-Time Multiplayer        │
│         🎯 Classic Casino Rules         │
│         ⚡ No Download Required         │
│                                         │
│              KhasinoGaming              │
└─────────────────────────────────────────┘
```

### 2. Twitter Card Image (twitter-card.png)

**Purpose**: Displayed when sharing on Twitter/X

**Specifications:**
- **Dimensions**: 1200 x 675 pixels (16:9 ratio)
- **Format**: PNG or JPG
- **File Size**: < 5MB (ideally < 1MB)
- **Location**: `public/twitter-card.png`

**Design Requirements:**
- Similar to OG image but wider aspect ratio
- Optimized for Twitter's card display
- Clear, bold text
- Eye-catching visuals
- Brand consistency

### 3. Favicon Set

**Purpose**: Browser tab icon, bookmarks, mobile home screen

**Required Sizes:**
- `favicon.ico` - 16x16, 32x32, 48x48 (multi-size ICO)
- `favicon-16x16.png` - 16 x 16 pixels
- `favicon-32x32.png` - 32 x 32 pixels
- `apple-touch-icon.png` - 180 x 180 pixels
- `favicon.svg` - Scalable (already exists)

**Location**: `public/` directory

**Design Requirements:**
- Simple, recognizable at small sizes
- Use game's primary icon/logo
- Transparent background for PNG
- High contrast

### 4. PWA Icons (Optional but Recommended)

**Purpose**: Progressive Web App installation

**Required Sizes:**
- `icon-192x192.png` - 192 x 192 pixels
- `icon-512x512.png` - 512 x 512 pixels

**Location**: `public/` directory

## Design Tools

### Free Tools
- **Canva**: https://www.canva.com (templates available)
- **Figma**: https://www.figma.com (professional design)
- **GIMP**: https://www.gimp.org (free Photoshop alternative)
- **Photopea**: https://www.photopea.com (online Photoshop)

### Paid Tools
- **Adobe Photoshop**: Industry standard
- **Sketch**: Mac-only design tool
- **Affinity Designer**: One-time purchase

## Image Optimization

After creating images, optimize them:

### Online Tools
- **TinyPNG**: https://tinypng.com (PNG compression)
- **Squoosh**: https://squoosh.app (Google's image optimizer)
- **ImageOptim**: https://imageoptim.com (Mac app)

### Command Line
```bash
# Install ImageMagick
npm install -g imagemagick

# Optimize PNG
convert og-image.png -strip -quality 85 og-image-optimized.png

# Optimize JPG
convert og-image.jpg -strip -quality 85 -sampling-factor 4:2:0 og-image-optimized.jpg
```

## Testing Social Media Images

### Facebook Sharing Debugger
- URL: https://developers.facebook.com/tools/debug/
- Paste your URL to see how it appears
- Click "Scrape Again" to refresh cache

### Twitter Card Validator
- URL: https://cards-dev.twitter.com/validator
- Preview how your card appears on Twitter
- Validate card markup

### LinkedIn Post Inspector
- URL: https://www.linkedin.com/post-inspector/
- Check how your link appears on LinkedIn
- Clear cache if needed

## Quick Start Guide

### Step 1: Create Base Design
1. Open Canva or your preferred tool
2. Create 1200x630px canvas for OG image
3. Add game title and key features
4. Include gameplay screenshot or illustration
5. Add branding (KhasinoGaming)

### Step 2: Create Twitter Variant
1. Resize to 1200x675px (16:9)
2. Adjust layout for wider format
3. Ensure text is still readable

### Step 3: Create Favicons
1. Design simple icon at 512x512px
2. Use online favicon generator: https://realfavicongenerator.net
3. Upload your icon
4. Download generated favicon package
5. Place files in public/ directory

### Step 4: Optimize Images
1. Use TinyPNG or Squoosh
2. Reduce file size without quality loss
3. Aim for < 300KB for OG images
4. Aim for < 50KB for favicons

### Step 5: Upload and Test
1. Place images in public/ directory
2. Deploy to production
3. Test with Facebook Debugger
4. Test with Twitter Card Validator
5. Check appearance on actual social posts

## Color Palette (From Game)

Use these colors for brand consistency:

```css
/* Primary Colors */
--casino-gold: #fbbf24;      /* Gold accent */
--casino-green: #065f46;     /* Table green */
--bg-primary: #0f172a;       /* Dark background */

/* Card Colors */
--card-red: #dc2626;         /* Hearts/Diamonds */
--card-black: #1f2937;       /* Spades/Clubs */

/* Accent Colors */
--accent-blue: #3b82f6;      /* Info/links */
--accent-purple: #8b5cf6;    /* Special features */
```

## Typography

Use clear, readable fonts:

**Recommended Fonts:**
- **Headings**: Montserrat Bold, Poppins Bold, Inter Bold
- **Body**: Inter Regular, Roboto Regular, Open Sans
- **Accent**: Playfair Display (for elegant touch)

**Font Sizes for Social Images:**
- Title: 72-96px
- Subtitle: 36-48px
- Body text: 24-32px
- Small text: 18-24px

## Example Layouts

### Layout 1: Screenshot Focus
```
┌─────────────────────────────────────────┐
│  CASINO CARD GAME                       │
│  Play Free Online                       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │   [Large Gameplay Screenshot]   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  KhasinoGaming.com/cassino              │
└─────────────────────────────────────────┘
```

### Layout 2: Feature Highlights
```
┌─────────────────────────────────────────┐
│                                         │
│         🎴 CASINO CARD GAME 🎴          │
│                                         │
│  ✓ Real-Time Multiplayer                │
│  ✓ Classic Casino Rules                 │
│  ✓ Free to Play                         │
│  ✓ No Download Required                 │
│                                         │
│  [Small Screenshot]  [Small Screenshot] │
│                                         │
│         Play Now at KhasinoGaming       │
└─────────────────────────────────────────┘
```

### Layout 3: Minimalist
```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│            CASINO                       │
│         CARD GAME                       │
│                                         │
│    Play Free Online with Friends        │
│                                         │
│              🎴 🎯 ⚡                   │
│                                         │
│         KhasinoGaming.com               │
│                                         │
└─────────────────────────────────────────┘
```

## Checklist

Before deploying social media images:

- [ ] OG image created (1200x630px)
- [ ] Twitter card created (1200x675px)
- [ ] Images optimized (< 300KB)
- [ ] Favicons generated (all sizes)
- [ ] Files placed in public/ directory
- [ ] Tested with Facebook Debugger
- [ ] Tested with Twitter Card Validator
- [ ] Verified on actual social posts
- [ ] Images load correctly on production
- [ ] Alt text added where applicable

## Need Help?

If you need assistance creating these images:

1. **Hire a Designer**: Fiverr, Upwork, 99designs
2. **Use Templates**: Canva has pre-made social media templates
3. **AI Tools**: Midjourney, DALL-E for image generation
4. **Stock Photos**: Unsplash, Pexels for background images

## Maintenance

Update social media images when:
- Major game updates or redesigns
- Seasonal promotions or events
- Rebranding or logo changes
- A/B testing different designs
- User feedback suggests improvements

Keep old versions in a `public/archive/` folder for reference.
