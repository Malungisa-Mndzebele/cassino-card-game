# Complete Test Coverage Documentation

This document lists all tests in the project and what they test.

---

## 📊 Test Overview

### Test Categories

1. **Backend Tests** (Python)
   - Game Logic Tests: `backend/test_game_logic_simple.py`
   - API Tests: `backend/test_main_simple.py`
   - Test Runner: `backend/run_simple_tests.py`

2. **Frontend Unit Tests** (Vitest)
   - Component tests: `tests/frontend/`
   - Integration tests: `tests/integration/`

3. **End-to-End Tests** (Playwright)
   - Full game flow: `tests/e2e/comprehensive-game.spec.ts`
   - Create/Join: `tests/e2e/create-join.spec.ts`
   - Smoke tests: `tests/e2e/simple-smoke-test.spec.ts`
   - Full game flow: `tests/e2e/full-game-flow.spec.ts`

---

## 🎮 Backend Game Logic Tests

**File**: `backend/test_game_logic_simple.py`  
**Runner**: `backend/run_simple_tests.py`

### Test Suite: `TestCasinoGameLogic` (22 tests)

#### 1. Deck & Card Tests

**`test_create_deck`**
- ✅ Deck has exactly 52 cards
- ✅ Contains all 4 suits (hearts, diamonds, clubs, spades)
- ✅ Contains all 13 ranks (A, 2-10, J, Q, K)
- ✅ All card IDs are unique
- ✅ No duplicate cards

**`test_card_values`**
- ✅ Ace (A) = 14 points
- ✅ King (K) = 13 points
- ✅ Queen (Q) = 12 points
- ✅ Jack (J) = 11 points
- ✅ Number cards (2-10) = their rank value
- ✅ Card values are correctly assigned

#### 2. Dealing Tests

**`test_deal_initial_cards`**
- ✅ Deals 4 cards to table
- ✅ Deals 4 cards to Player 1
- ✅ Deals 4 cards to Player 2
- ✅ Remaining deck has 40 cards (52 - 12)
- ✅ All dealt cards are unique
- ✅ No cards lost or duplicated

**`test_deal_round_cards`**
- ✅ Deals 4 cards to Player 1 for round 2
- ✅ Deals 4 cards to Player 2 for round 2
- ✅ Correctly calculates remaining deck size
- ✅ Cards are distributed properly

#### 3. Capture Validation Tests

**`test_validate_capture_direct_match`**
- ✅ Can capture a card with same rank/value
- ✅ Direct match validation works
- ✅ Example: King captures King

**`test_validate_capture_sum_match`**
- ✅ Can capture multiple cards that sum to hand card value
- ✅ Sum validation works correctly
- ✅ Example: 8 captures (3 + 5)

**`test_validate_capture_invalid`**
- ✅ Rejects invalid captures
- ✅ Cards that don't match or sum are rejected
- ✅ Example: 8 cannot capture (3 + 2)

**`test_capture_with_build_and_table_mix`**
- ✅ Can capture using both builds and table cards
- ✅ Hand value 10 can capture build of value 10
- ✅ Complex capture scenarios work

**`test_get_possible_captures`**
- ✅ Finds all possible capture combinations
- ✅ Returns valid capture options
- ✅ Includes direct matches and sum matches

#### 4. Build Tests

**`test_validate_build`**
- ✅ Validates builds correctly
- ✅ Ensures player can capture the build value
- ✅ Example: Can build 8 if has 8 to capture it

**`test_validate_build_invalid_no_capturing_card`**
- ✅ Rejects builds when player can't capture
- ✅ Requires matching card in hand to build
- ✅ Example: Can't build 8 without having 8 in hand

**`test_build_requires_capturing_card`**
- ✅ Builds require a capturing card
- ✅ Must have card matching build value
- ✅ Prevents invalid builds

**`test_get_possible_builds`**
- ✅ Finds all possible build combinations
- ✅ Returns valid build options with values
- ✅ Includes target cards for each build

**`test_execute_build`**
- ✅ Successfully creates a build
- ✅ Build contains correct cards
- ✅ Build has correct value and owner
- ✅ Cards removed from table

#### 5. Action Execution Tests

**`test_execute_capture`**
- ✅ Captures cards correctly
- ✅ Hand card and target cards moved to captured pile
- ✅ Builds are removed when captured
- ✅ Table cards are removed when captured

**`test_execute_trail`**
- ✅ Places card on table
- ✅ Card moved from hand to table
- ✅ No capture or build performed

#### 6. Value Combination Tests

**`test_can_make_value`**
- ✅ Checks if cards can combine to make a value
- ✅ Handles multiple card combinations
- ✅ Example: (3, 5, 2) can make 8, 5, 3, 2, 7, 10
- ✅ Rejects impossible combinations

#### 7. Scoring Tests

**`test_calculate_score`**
- ✅ Aces = 1 point each
- ✅ 2 of Spades = 1 point
- ✅ 10 of Diamonds = 2 points
- ✅ Other cards = 0 points
- ✅ Total score calculation is correct

**`test_calculate_bonus_scores`**
- ✅ Most cards bonus = 2 points
- ✅ Most spades bonus = 2 points
- ✅ Bonuses awarded to correct player
- ✅ Tie handling (no bonus)

#### 8. Game State Tests

**`test_determine_winner`**
- ✅ Player 1 wins on higher score
- ✅ Player 2 wins on higher score
- ✅ Tie on score: winner based on more cards
- ✅ Complete tie (score + cards) = None

**`test_is_round_complete`**
- ✅ Round complete when both players have no cards
- ✅ Round not complete when players have cards

**`test_is_game_complete`**
- ✅ Game complete after round 2
- ✅ Game complete when no more cards
- ✅ Game not complete during round 1

---

## 🔌 Backend API Tests

**File**: `backend/test_main_simple.py`  
**Note**: These tests use FastAPI TestClient with in-memory SQLite

### Test Suite: `TestCasinoAPI` (14 tests)

#### 1. Health Check

**`test_health_check`**
- ✅ `/health` endpoint returns 200
- ✅ Returns `{"status": "healthy", "message": "..."}`
- ✅ Backend is running correctly

#### 2. Room Management

**`test_create_room`**
- ✅ `POST /rooms/create` creates a room
- ✅ Returns room_id (6-character string)
- ✅ Returns player_id for creator
- ✅ Returns initial game_state
- ✅ Room saved to database

**`test_join_room`**
- ✅ `POST /rooms/join` joins existing room
- ✅ Returns player_id for joiner
- ✅ Returns updated game_state
- ✅ Both players in room
- ✅ Room saved to database

**`test_join_nonexistent_room`**
- ✅ `POST /rooms/join` with invalid room_id returns 404
- ✅ Error handling works correctly

**`test_join_room_full`**
- ✅ Cannot join room with 2 players already
- ✅ Returns 400 Bad Request
- ✅ Prevents third player

**`test_get_game_state`**
- ✅ `GET /rooms/{room_id}/state` returns current state
- ✅ Returns correct room_id
- ✅ Returns all players in room
- ✅ State is accurate

#### 3. Player Ready Status

**`test_set_player_ready`**
- ✅ `POST /rooms/player-ready` sets ready status
- ✅ Player 1 ready status updates
- ✅ Player 2 ready status updates
- ✅ Game transitions to "dealer" phase when both ready
- ✅ Auto-transition works

**`test_set_ready_invalid_player`**
- ✅ Cannot set ready for non-existent player
- ✅ Returns 404 Not Found

#### 4. Game Start

**`test_start_shuffle`**
- ✅ `POST /game/start-shuffle` starts shuffle
- ✅ `shuffle_complete` set to True
- ✅ Game proceeds to next phase

**`test_select_face_up_cards`**
- ✅ `POST /game/select-face-up-cards` starts game
- ✅ `game_started` set to True
- ✅ Phase transitions to "round1"
- ✅ Turn set to Player 1
- ✅ Cards dealt: 4 table, 4 player1, 4 player2

#### 5. Gameplay Actions

**`test_play_card_trail`**
- ✅ `POST /game/play-card` with "trail" action works
- ✅ Card moved from hand to table
- ✅ Turn switches to next player
- ✅ Game state updates correctly

**`test_play_wrong_turn`**
- ✅ Cannot play when not your turn
- ✅ Returns 400 Bad Request
- ✅ Turn validation works

**`test_play_invalid_action`**
- ✅ Invalid action string rejected
- ✅ Returns 400 Bad Request

**`test_build_invalid_same_value`**
- ✅ Cannot build with same value as hand card
- ✅ Returns 400 Bad Request
- ✅ Build validation works

#### 6. Game Reset

**`test_reset_game`**
- ✅ `POST /game/reset` resets game state
- ✅ Phase returns to "waiting"
- ✅ Turn reset to 1
- ✅ Round reset to 0
- ✅ All hands and table cleared
- ✅ Ready status reset

#### 7. WebSocket

**`test_websocket_broadcast`**
- ✅ WebSocket connection works
- ✅ Messages broadcast to room
- ✅ `/ws/{room_id}` endpoint functional

---

## 🎨 Frontend Unit Tests

**Framework**: Vitest  
**Command**: `npm run test:frontend`

### Current Tests

**`tests/frontend/App.mount.test.tsx`**
- ⚠️ Currently empty (placeholder)

**`tests/integration/GameCreation.test.tsx`**
- ⚠️ Currently empty (placeholder)

**`tests/integration/GameFlow.test.tsx`**
- ⚠️ Currently empty (placeholder)

**`App.test.tsx`**
- ⚠️ Currently empty (placeholder)

**Note**: Frontend unit tests are set up but not yet implemented.

---

## 🌐 End-to-End Tests (Playwright)

**Framework**: Playwright  
**Command**: `npm run test:e2e`

### Test Files

#### 1. `tests/e2e/simple-smoke-test.spec.ts`

**`test('Page loads and shows landing page')`**
- ✅ Page loads without errors
- ✅ React renders correctly
- ✅ Landing page content visible
- ✅ Game-related content present
- ✅ Screenshot captured for debugging

**`test('Can find room manager or create button')`**
- ✅ Room manager component exists
- ✅ Create room button visible
- ✅ Join room button visible
- ✅ UI elements accessible

#### 2. `tests/e2e/create-join.spec.ts`

**`test('landing renders and shows actions')`**
- ✅ Landing page renders
- ✅ "Create New Room" button visible
- ✅ "Join Existing Room" button visible
- ✅ Basic UI functionality works

#### 3. `tests/e2e/comprehensive-game.spec.ts`

**`test('Complete game flow with two players')`**

This is the most comprehensive E2E test, simulating a full game:

**Phase 1: Room Creation & Joining**
- ✅ Player 1 creates room
- ✅ Room ID generated
- ✅ Player 1 enters game (not on landing)
- ✅ Player 2 joins room with room ID
- ✅ Player 2 enters game (not on landing)
- ✅ Both players see each other
- ✅ Player names displayed correctly

**Phase 2: Ready Status**
- ✅ Player 1 clicks ready
- ✅ Player 2 clicks ready
- ✅ Both players ready status updates
- ✅ Game transitions from waiting phase

**Phase 3: Dealer Phase**
- ✅ Game enters dealer phase
- ✅ Auto-transition works
- ✅ Ready to deal screen shown

**Phase 4: Gameplay**
- ✅ Game enters round 1
- ✅ Cards are dealt
- ✅ Players can see their cards
- ✅ Turn alternates correctly
- ✅ Player 1 can play cards
- ✅ Player 2 can play cards
- ✅ Trail action works
- ✅ Multiple turns played
- ✅ Game progresses correctly

**Phase 5: Verification**
- ✅ Game UI elements visible
- ✅ Not stuck on landing page
- ✅ Scores displayed
- ✅ Game completion detection
- ✅ Final state correct

**Error Handling:**
- ✅ Screenshots captured on failure
- ✅ Console logs captured
- ✅ Both player perspectives logged

---

## 🧪 CI/CD Test Execution

### GitHub Actions Workflows

#### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers**: Pull requests, pushes to main/master

**Backend Tests:**
- ✅ Installs Python 3.11
- ✅ Installs backend dependencies
- ✅ Runs `backend/run_simple_tests.py`
- ✅ All 22 game logic tests must pass

**Frontend Tests:**
- ✅ Installs Node.js 18
- ✅ Installs npm dependencies
- ✅ Runs TypeScript type check
- ✅ Runs ESLint
- ✅ Runs Vitest unit tests
- ✅ All frontend tests must pass

#### 2. Deploy Backend Workflow (`.github/workflows/deploy-backend.yml`)

**Triggers**: Push to main/master with backend changes

**Tests Before Deployment:**
- ✅ Runs `backend/run_simple_tests.py`
- ✅ All game logic tests must pass
- ✅ Only deploys if tests pass

#### 3. Deploy Frontend Workflow (`.github/workflows/deploy-frontend.yml`)

**Triggers**: Push to main/master with frontend changes

**Tests Before Deployment:**
- ✅ Runs `npm run test:frontend`
- ✅ Frontend tests must pass
- ✅ Only deploys if tests pass

---

## 📊 Test Summary

### Total Tests

| Category | Test Count | Status |
|----------|-----------|--------|
| **Backend Game Logic** | 22 tests | ✅ All passing |
| **Backend API** | 14 tests | ✅ All passing |
| **Frontend Unit** | 0 tests | ⚠️ Placeholders only |
| **E2E Tests** | 3 test suites | ✅ Passing |
| **Total** | **39+ tests** | ✅ |

### Test Coverage Areas

✅ **Fully Tested:**
- Game logic (cards, dealing, capture, build, trail)
- Scoring system (points, bonuses)
- Win conditions
- API endpoints (all routes)
- Room management
- Player ready status
- Game state management
- WebSocket connections
- Error handling
- E2E game flow

⚠️ **Partially Tested:**
- Frontend components (setup but not implemented)
- Integration tests (setup but not implemented)

---

## 🎯 Test Commands

### Run All Tests Locally

```bash
# Backend tests
cd backend
python run_simple_tests.py

# Frontend tests
npm run test:frontend

# E2E tests
npm run test:e2e

# Specific E2E test
npm run test:e2e:full-game
```

### Run Tests in CI/CD

All tests run automatically on:
- **Pull Requests** → CI workflow
- **Push to main/master** → CI + Deploy workflows

---

## ✅ What Gets Tested

### Game Logic ✅
- Deck creation (52 cards, all suits/ranks)
- Card dealing (initial and round 2)
- Capture validation (direct match, sum match)
- Build validation (with capturing card requirement)
- Action execution (capture, build, trail)
- Score calculation (points and bonuses)
- Win condition detection
- Round completion detection
- Game completion detection

### API Endpoints ✅
- Health check
- Room creation
- Room joining
- Get game state
- Set player ready
- Start shuffle
- Select face-up cards
- Play card (all actions)
- Reset game
- Error handling (404, 400)
- WebSocket connections

### E2E Game Flow ✅
- Full game from start to finish
- Two players playing complete game
- UI interactions
- Real-time updates
- Game state synchronization
- Error scenarios

### Frontend Components ⚠️
- Placeholder tests exist but not implemented
- Could test: component rendering, user interactions, state management

---

**All critical game logic and API functionality is thoroughly tested! 🎉**
