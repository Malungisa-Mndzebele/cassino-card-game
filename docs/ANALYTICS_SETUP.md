# Google Analytics Setup Guide

## Overview

This guide walks you through setting up Google Analytics 4 (GA4) for the Casino Card Game to track user behavior, engagement, and conversions.

## Step 1: Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com)
2. Click "Start measuring" or "Admin" (gear icon)
3. Click "Create Account"
4. Enter account name: "KhasinoGaming" (or your preferred name)
5. Configure data sharing settings (recommended: all enabled)
6. Click "Next"

## Step 2: Create Property

1. Property name: "Casino Card Game"
2. Reporting time zone: Select your timezone
3. Currency: USD (or your preferred currency)
4. Click "Next"

## Step 3: Set Up Data Stream

1. Select platform: "Web"
2. Website URL: `https://khasinogaming.com`
3. Stream name: "Casino Card Game - Production"
4. Click "Create stream"

## Step 4: Get Measurement ID

1. After creating the stream, you'll see your Measurement ID
2. Format: `G-XXXXXXXXXX`
3. Copy this ID - you'll need it next


## Step 5: Configure Your Application

1. Open your `.env` file in the project root
2. Add your Measurement ID:
   ```
   VITE_GA_MEASUREMENT_ID=G-MD75NPR35D
   ```
3. Save the file

## Step 6: Verify Installation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:5173/cassino/`

3. Open browser DevTools (F12) → Network tab

4. Look for requests to `googletagmanager.com` - this confirms GA is loading

5. In Google Analytics:
   - Go to Reports → Realtime
   - You should see your active session within 30 seconds

## Step 7: Set Up Enhanced Measurement (Recommended)

1. In Google Analytics, go to Admin → Data Streams
2. Click on your web stream
3. Scroll to "Enhanced measurement"
4. Enable these events:
   - ✅ Page views (already enabled)
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Video engagement
   - ✅ File downloads

## Step 8: Create Custom Events (Already Implemented)

The following custom events are already tracked in the application:

### Room Events
- `room_created` - When a player creates a new room
- `room_joined` - When a player joins a room
- `room_left` - When a player leaves a room

### Game Events
- `game_started` - When a game begins
- `game_completed` - When a game finishes (includes winner and duration)

### Gameplay Events
- `card_played` - When a player plays a card (capture/build/trail)

### Communication Events
- `voice_chat_enabled` - When voice chat is activated
- `video_chat_enabled` - When video chat is activated

### Connection Events
- `connection_lost` - When WebSocket connection drops
- `connection_restored` - When connection is restored

### Error Events
- `error` - When errors occur (includes error type and message)

## Step 9: Set Up Conversions

1. In Google Analytics, go to Admin → Events
2. Mark these events as conversions:
   - `game_completed` - Primary conversion
   - `room_created` - Secondary conversion
   - `game_started` - Engagement conversion

## Step 10: Create Custom Reports

### Recommended Reports:

1. **Game Engagement Report**
   - Metric: game_completed events
   - Dimension: Date
   - Secondary dimension: Winner

2. **Room Activity Report**
   - Metric: room_created, room_joined
   - Dimension: Date
   - Filter: Event name contains "room"

3. **Communication Usage Report**
   - Metric: voice_chat_enabled, video_chat_enabled
   - Dimension: Date

## Step 11: Set Up Alerts (Optional)

1. Go to Admin → Custom Alerts
2. Create alerts for:
   - Sudden drop in traffic (> 50% decrease)
   - High error rate (> 10 errors per hour)
   - Zero game completions for 24 hours

## Testing Your Setup

### Test Checklist:

- [ ] Visit homepage - check Realtime report
- [ ] Create a room - verify `room_created` event
- [ ] Join a room - verify `room_joined` event
- [ ] Start a game - verify `game_started` event
- [ ] Play cards - verify `card_played` events
- [ ] Complete a game - verify `game_completed` event
- [ ] Visit rules page - verify page view

### Debug Mode (Development Only)

To see detailed GA events in console:

1. Open browser DevTools → Console
2. Run:
   ```javascript
   window.gtag('config', 'G-MD75NPR35D', { debug_mode: true });
   ```
3. Reload the page
4. You'll see detailed event logging

## Integrating Analytics in Your Code

### Track Custom Events

```typescript
import { gameEvents } from '$lib/utils/analytics';

// Track room creation
gameEvents.roomCreated(roomId);

// Track game completion
gameEvents.gameCompleted(roomId, winnerId, durationInSeconds);

// Track card play
gameEvents.cardPlayed('capture'); // or 'build', 'trail'

// Track errors
gameEvents.error('websocket_error', 'Connection timeout');
```

### Track Page Timing

```typescript
import { trackTiming } from '$lib/utils/analytics';

const startTime = performance.now();
// ... load game state ...
const loadTime = performance.now() - startTime;

trackTiming('game_load', 'initial_load', loadTime);
```

### Set User Properties

```typescript
import { setUserProperties } from '$lib/utils/analytics';

setUserProperties({
  player_level: 'beginner',
  games_played: 5,
  preferred_mode: 'multiplayer'
});
```

## Privacy Considerations

### GDPR Compliance

1. Add cookie consent banner (recommended library: `cookie-consent`)
2. Update privacy policy to mention Google Analytics
3. Provide opt-out mechanism

### IP Anonymization

Already enabled by default in GA4, but you can verify:
1. Go to Admin → Data Settings → Data Collection
2. Ensure "IP anonymization" is enabled

## Troubleshooting

### Events Not Showing Up

1. **Check Measurement ID**: Verify `G-MD75NPR35D` is correct
2. **Check Network**: Look for blocked requests in DevTools
3. **Check Ad Blockers**: Disable temporarily to test
4. **Wait 24-48 hours**: Some reports have delays

### Realtime Not Working

1. Clear browser cache
2. Try incognito/private mode
3. Check if GA script is loading (Network tab)
4. Verify no JavaScript errors in Console

### Events Firing Multiple Times

1. Check if Analytics component is mounted multiple times
2. Verify no duplicate gtag scripts in HTML
3. Review event tracking code for loops

## Best Practices

1. **Don't Track PII**: Never send personal information (names, emails, IPs)
2. **Use Descriptive Names**: Event names should be clear and consistent
3. **Add Context**: Include relevant parameters with events
4. **Test Thoroughly**: Verify events in development before deploying
5. **Monitor Regularly**: Check reports weekly for anomalies
6. **Document Changes**: Keep track of custom events and their purposes

## Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [Event Reference](https://support.google.com/analytics/answer/9267735)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Debug View](https://support.google.com/analytics/answer/7201382)

## Support

For issues with Google Analytics:
- [GA4 Help Center](https://support.google.com/analytics)
- [GA4 Community](https://support.google.com/analytics/community)

For issues with the implementation:
- Check `src/lib/components/Analytics.svelte`
- Check `src/lib/utils/analytics.ts`
- Review browser console for errors

---

**Your Analytics ID**: `G-MD75NPR35D`

**Status**: ✅ Configured and ready to use

**Next Steps**:
1. Deploy to production
2. Monitor Realtime reports
3. Set up custom conversions
4. Create custom reports
