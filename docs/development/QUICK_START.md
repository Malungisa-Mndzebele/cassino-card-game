# 🚀 Quick Start - Testing Bug Fixes

## Start the Application

```bash
# Terminal 1: Backend
cd backend
python main.py

# Terminal 2: Frontend
npm run dev
```

## 5-Minute Test (2 Players)

### Player 1
1. Open `http://localhost:5173`
2. Enter name "Player1"
3. Click "Create Room"
4. Share room code with Player 2

### Player 2
1. Open `http://localhost:5173` (different browser/tab)
2. Enter name "Player2"
3. Enter room code
4. Click "Join Room"

### Both Players
1. **Player 1**: Click "Ready" → Both should see ✓ Ready
2. **Player 2**: Click "Ready" → Game should start automatically

## ✅ Success Checklist

- [ ] Player 2 join visible to Player 1 (no refresh)
- [ ] Ready states sync in real-time
- [ ] Game starts when both ready
- [ ] New tabs show lobby (not previous room)
- [ ] No errors in console

## 🐛 If Something Fails

1. Open Browser Console (F12)
2. Check for error messages
3. Verify backend is running on port 8000
4. Check WebSocket connection in Network tab

## 📚 Documentation

- **TESTING_QUICK_GUIDE.md** - Detailed testing instructions
- **BUG_FIXES_COMPLETE.md** - Technical documentation
- **DEPLOYMENT_SUMMARY.md** - Deployment details

## 🎯 What Was Fixed

1. Session persistence (24-hour expiry)
2. Real-time synchronization (WebSocket broadcasts)
3. Player join notifications
4. Automatic game start
5. Ready state persistence
6. Name display consistency

All 106 tests passing ✅
