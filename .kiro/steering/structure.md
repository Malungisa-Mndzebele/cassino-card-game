# Project Structure

## Root Organization

```
cassino-card-game/
├── backend/              # Python FastAPI backend
├── components/           # React components
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── styles/               # Global styles
├── tests/                # Test suites
├── public/               # Static assets
└── [config files]        # Build and deployment configs
```

## Backend Structure (`backend/`)

Core backend modules follow a clean separation of concerns:

- `main.py` - FastAPI app, routes, WebSocket endpoints
- `models.py` - SQLAlchemy database models (Room, Player, GameSession)
- `schemas.py` - Pydantic request/response schemas
- `game_logic.py` - Pure game mechanics (capture, build, trail, scoring)
- `database.py` - Database connection and session management
- `websocket_manager.py` - WebSocket connection handling
- `session_manager.py` - Player session tracking and reconnection
- `state_recovery.py` - Game state recovery for reconnecting players
- `action_logger.py` - Game action logging for replay/recovery
- `background_tasks.py` - Periodic cleanup and monitoring tasks
- `alembic/` - Database migration scripts

## Frontend Structure

### SvelteKit Structure (`src/`)

- `routes/` - SvelteKit file-based routing
  - `+page.svelte` - Home/lobby page
  - `room/[id]/+page.svelte` - Waiting room
  - `game/[id]/+page.svelte` - Game table
- `lib/` - Shared libraries
  - `components/` - Svelte components
    - `RoomManager.svelte` - Lobby for creating/joining rooms
    - `CasinoRoomView.svelte` - Waiting room before game starts
    - `PokerTableView.svelte` - Main game table (round1/round2 phases)
    - `GamePhases.svelte` - Handles special phases (cardSelection, dealing, finished)
    - `Card.svelte` - Individual card component
    - `Dealer.svelte` - Dealer/shuffle animations
    - `GameActions.svelte` - Action buttons (capture, build, trail)
    - `GameHints.svelte` - Hint system for valid moves
    - `GameSettings.svelte` - Settings panel and preferences
    - `PlayerHand.svelte` - Player's hand display
    - `SoundSystem.svelte` - Audio management
    - `ui/` - Reusable UI primitives (buttons, dialogs, etc.)
    - `app/` - App-level components (header, decorations)
  - `stores/` - Svelte stores (state management)
    - `gameState.svelte.ts` - Core game state (cards, scores, phase) using Svelte 5 runes
    - `connectionState.svelte.ts` - Connection status and errors
    - `websocket.svelte.ts` - WebSocket connection and message handling
    - `gameActions.svelte.ts` - Game action handlers (playCard, shuffle, etc.)
    - `roomActions.svelte.ts` - Room management (create, join, leave)

### Types (`types/`)

- `gameTypes.ts` - Centralized TypeScript interfaces (GameState, Player, Card, Build, etc.)

### Utilities (`utils/`)

- `config.ts` - Environment configuration and API URLs
- `sessionToken.ts` - Session token management for reconnection

## Test Structure (`tests/`)

- `frontend/` - Vitest component tests
- `e2e/` - Playwright end-to-end tests
- `integration/` - Integration tests
- `performance/` - Load and performance tests
- `test-utils.tsx` - Shared test utilities

## Configuration Files

- `vite.config.ts` - Vite build configuration (base: '/cassino/')
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - TailwindCSS configuration
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration
- `.eslintrc.json` - ESLint rules
- `.prettierrc` - Code formatting rules

## Architecture Patterns

### Frontend Architecture

SvelteKit uses a **Svelte stores pattern** for state management:
1. Stores manage specific domains (game, connection, websocket) using Svelte 5 runes
2. Action stores encapsulate business logic
3. Components remain presentational and subscribe to stores
4. No global state library - Svelte's built-in reactivity handles state

### Backend Architecture

FastAPI follows a **layered architecture**:
1. Routes (main.py) - HTTP/WebSocket endpoints
2. Schemas (schemas.py) - Request/response validation
3. Models (models.py) - Database entities
4. Logic (game_logic.py) - Pure business logic
5. Services (session_manager, state_recovery) - Cross-cutting concerns

### Data Flow

1. User action → Component
2. Component calls hook function
3. Hook makes API call
4. Backend processes and updates database
5. Backend broadcasts WebSocket message
6. Frontend receives WebSocket update
7. Hook updates local state
8. Component re-renders

## Key Conventions

- **TypeScript**: Strict typing, interfaces in `types/gameTypes.ts`
- **Component Props**: Explicit prop interfaces using Svelte's typed props
- **API Client**: Centralized in `lib/api/client.ts`
- **Error Handling**: Errors displayed via connection state store
- **Testing**: Test IDs use `data-testid` attribute
- **Styling**: TailwindCSS utility classes, custom casino theme colors
- **File Naming**: PascalCase for components (.svelte), camelCase for utilities/stores (.ts)
