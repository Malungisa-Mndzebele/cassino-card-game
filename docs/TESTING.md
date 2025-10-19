## Testing

### Back-end Tests (no pytest required)
- Quick logic tests:
  - `cd backend && python run_simple_tests.py`
- Full suite (logic + API):
  - `cd backend && python run_all_tests.py`

### What is covered
- Game logic: deck creation, dealing, value mapping, capture/build/trail validation and execution, scoring, winner, round/game completion, helpers.
- API: create/join, state fetch, set ready (phase transition), start shuffle, select face-up (deal), play trail (turn switching, table update), reset.

### Gaps / Future tests
- Negative API paths (invalid room/player/action/turn errors).
- Complex capture/build combos across builds and table cards.
- WebSocket lifecycle (connect/broadcast/disconnect).
- Persistence integrity across sequential plays.
- Frontend interaction tests (vitest) for critical flows.


