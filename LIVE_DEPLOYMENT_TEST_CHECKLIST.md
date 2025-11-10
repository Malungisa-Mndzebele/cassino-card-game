# Live Deployment Test Checklist
**Site:** https://khasinogaming.com/cassino/  
**Date:** November 8, 2025  
**Status:** 🔄 Testing in Progress

---

## 🌐 Manual Testing Checklist

### 1. Frontend Accessibility ✅
- [ ] Site loads at https://khasinogaming.com/cassino/
- [ ] No 404 or 500 errors
- [ ] Page renders correctly
- [ ] CSS and assets load properly
- [ ] No console errors (check browser DevTools)

### 2. Landing Page UI ✅
- [ ] "Create Room" section visible (left side, emerald green theme)
- [ ] "Join Room" section visible (right side, blue theme)
- [ ] Player name input fields work
- [ ] Room code input field works
- [ ] Buttons are clickable and styled correctly
- [ ] Header displays "Casino Card Game"
- [ ] Responsive on mobile devices

### 3. Create Room Flow ✅
- [ ] Enter player name
- [ ] Click "Create Room" button
- [ ] Room code appears (4-character code)
- [ ] Redirected to waiting room
- [ ] Player name shows in waiting room
- [ ] "Ready" button is visible
- [ ] Room code is displayed and copyable

### 4. Join Room Flow ✅
- [ ] Enter player name
- [ ] Enter valid room code
- [ ] Click "Join Room" button
- [ ] Successfully joins the room
- [ ] Both players visible in waiting room
- [ ] Can mark as ready

### 5. WebSocket Connection ✅
- [ ] WebSocket connects on room creation
- [ ] Real-time updates work (player joins, ready status)
- [ ] No connection errors in console
- [ ] Reconnection works after brief disconnect
- [ ] Messages sync between players

### 6. Game Start Flow ✅
- [ ] Both players can mark ready
- [ ] "Start Game" button appears when all ready
- [ ] Game starts when button clicked
- [ ] Cards are dealt correctly
- [ ] Game board displays properly

### 7. Gameplay ✅
- [ ] Player hands display correctly
- [ ] Table cards display correctly
- [ ] Current player indicator works
- [ ] Can select cards from hand
- [ ] Can select cards from table
- [ ] Action buttons work (Capture, Build, Trail)
- [ ] Turns alternate correctly
- [ ] Scores update in real-time

### 8. Game End Flow ✅
- [ ] Game ends when deck is empty
- [ ] Final scores calculated correctly
- [ ] Winner announced
- [ ] Can return to lobby
- [ ] Can start new game

### 9. Error Handling ✅
- [ ] Invalid room code shows error
- [ ] Empty name shows validation error
- [ ] Disconnection shows reconnect option
- [ ] Invalid moves show error message
- [ ] Network errors handled gracefully

### 10. Performance ✅
- [ ] Page loads in < 3 seconds
- [ ] No lag during gameplay
- [ ] Smooth animations
- [ ] No memory leaks (check DevTools)
- [ ] Works on slow connections

### 11. Cross-Browser Testing ✅
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### 12. Mobile Responsiveness ✅
- [ ] Layout adapts to mobile screens
- [ ] Touch interactions work
- [ ] Buttons are large enough to tap
- [ ] Text is readable
- [ ] No horizontal scrolling
- [ ] Cards are selectable on touch

---

## 🔧 API Testing

### Health Check
```bash
curl https://khasinogaming.com/api/health
# Expected: {"status": "healthy"}
```

### Create Room
```bash
curl -X POST https://khasinogaming.com/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"player_name": "TestPlayer"}'
# Expected: {"room_code": "XXXX", "player_id": "..."}
```

### Join Room
```bash
curl -X POST https://khasinogaming.com/api/rooms/XXXX/join \
  -H "Content-Type: application/json" \
  -d '{"player_name": "Player2"}'
# Expected: {"player_id": "...", "room": {...}}
```

---

## 🐛 Known Issues to Check

1. **WebSocket Connection**
   - Check if WSS (secure WebSocket) is working
   - Verify no CORS issues
   - Test reconnection after network interruption

2. **Room Code Validation**
   - Test with invalid codes
   - Test with expired rooms
   - Test with full rooms

3. **Game State Sync**
   - Verify all players see same game state
   - Check if actions sync immediately
   - Test with 3+ players

4. **Mobile Issues**
   - Card selection on small screens
   - Keyboard covering inputs
   - Orientation changes

---

## 📊 Performance Metrics

### Target Metrics
- **Page Load**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **WebSocket Latency**: < 100ms
- **Action Response**: < 200ms

### Lighthouse Scores (Target)
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

---

## ✅ Quick Verification Steps

1. **Open the site**: https://khasinogaming.com/cassino/
2. **Create a room** with your name
3. **Copy the room code**
4. **Open in incognito/private window**
5. **Join the room** with the code
6. **Mark both players ready**
7. **Start the game**
8. **Play a few turns**
9. **Verify everything works smoothly**

---

## 🎯 Success Criteria

- ✅ All core features work
- ✅ No critical bugs
- ✅ Performance meets targets
- ✅ Mobile experience is good
- ✅ No console errors
- ✅ WebSocket connection stable
- ✅ Game logic is correct
- ✅ UI is polished and responsive

---

## 📝 Test Results

### Automated Tests
- **Status**: Running Playwright E2E tests
- **Command**: `npx playwright test --config=playwright.production.config.ts`
- **Results**: Pending...

### Manual Tests
- **Tester**: [Your Name]
- **Date**: [Test Date]
- **Browser**: [Browser Used]
- **Device**: [Device Used]
- **Results**: [Pass/Fail with notes]

---

## 🚀 Next Steps After Testing

1. **If all tests pass**:
   - ✅ Mark deployment as stable
   - 📢 Announce to users
   - 📊 Monitor analytics
   - 🎉 Celebrate!

2. **If issues found**:
   - 🐛 Document bugs
   - 🔧 Create fix tasks
   - 🔄 Deploy fixes
   - ✅ Re-test

---

**Last Updated**: November 8, 2025  
**Next Review**: After any deployment changes
