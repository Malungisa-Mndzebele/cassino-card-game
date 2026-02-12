# Build Capture Bug Fix

## Summary
Fixed a critical bug where capturing one build with an Ace would incorrectly capture ALL builds on the table that matched any of the Ace's possible values (1 or 14).

## The Bug
**Scenario:**
1. Player 1 builds 13 using 8 + 5
2. Player 2 builds 14 using 10 + 4  
3. Player 1 plays an Ace (which can be 1 or 14) to capture the 14-build
4. **Bug:** Both the 13-build AND the 14-build were captured
5. **Expected:** Only the 14-build should be captured

## Root Cause
The `execute_capture` method in `backend/game_logic.py` was receiving only the targeted builds but was supposed to return ALL remaining builds. This caused a mismatch where the method couldn't properly calculate which builds should remain on the table.

## The Fix
**Changes Made:**
1. Updated `execute_capture` signature to accept both:
   - `target_builds`: The specific builds being captured
   - `all_builds`: All builds currently on the table

2. The method now:
   - Captures only the cards from `target_builds`
   - Returns all builds from `all_builds` except those in `target_builds`

3. Updated all call sites:
   - `backend/main.py` (2 locations: player capture and AI capture)
   - `backend/services/game_service.py`
   - `backend/test_build_feature.py`

**Files Modified:**
- `backend/game_logic.py` - Fixed execute_capture method
- `backend/main.py` - Updated capture endpoints
- `backend/services/game_service.py` - Updated game service
- `backend/test_build_feature.py` - Updated existing test
- `backend/test_capture_bug.py` - NEW: Added specific test for this bug

## Testing

### Backend Tests (Automated)
Run the new test to verify the fix:
```bash
cd backend
python test_capture_bug.py
```

**Expected Output:**
```
✓ Test PASSED: Only the targeted build was captured
✓ Test PASSED: Both targeted builds were captured
✅ All tests passed!
```

### Manual Testing on Live Game

**Test URL:** https://khasinogaming.com/cassino/

**Test Scenario:**
1. Create a room with two players
2. Start the game and play until you can create builds
3. Player 1: Build 13 using an 8 and a 5
4. Player 2: Build 14 using a 10 and a 4
5. Player 1: Play an Ace to capture the 14-build
6. **Verify:** Only the 14-build is captured, the 13-build remains on the table

**Alternative Test Scenarios:**

**Scenario A: Ace captures 14-build**
- Player 1 builds: 13 (8+5)
- Player 2 builds: 14 (10+4)
- Player 1 plays Ace → Should capture only 14-build
- Expected: 13-build remains

**Scenario B: Ace captures 1-build**  
- Player 1 builds: 5 (2+3)
- Player 2 builds: 1 (Ace on table)
- Player 1 plays Ace → Should capture only 1-build
- Expected: 5-build remains

**Scenario C: Multiple builds with same value**
- Player 1 builds: 7 (3+4)
- Player 2 builds: 7 (2+5)
- Player 1 plays 7 and targets BOTH builds → Should capture both
- Expected: Both 7-builds captured (this is correct behavior)

## Deployment Status

✅ **Backend:** Pushed to GitHub (commit a9489b8)
- Render will automatically deploy the fix
- Check deployment status: https://dashboard.render.com

✅ **Tests:** Pushed to GitHub (commit 5cd6bba)
- Backend unit tests verify the fix
- E2E test placeholder added for manual verification

## Verification Checklist

After deployment completes:

- [ ] Backend health check: https://cassino-game-backend.onrender.com/health
- [ ] Create a test game on live site
- [ ] Reproduce the original bug scenario
- [ ] Verify only targeted build is captured
- [ ] Test with different build values
- [ ] Test capturing multiple builds intentionally
- [ ] Verify game continues normally after capture

## Rollback Plan

If issues are found:
1. Revert to previous commit: `git revert a9489b8`
2. Push to trigger redeployment
3. Investigate and fix in development environment

## Notes

- The fix maintains backward compatibility
- All existing tests pass
- No database migration required
- No frontend changes needed
- Cache invalidation handled automatically

## Contact

If you encounter any issues with this fix, please report them with:
- Room code
- Player names
- Cards involved in the build
- Screenshot if possible
- Browser console logs
