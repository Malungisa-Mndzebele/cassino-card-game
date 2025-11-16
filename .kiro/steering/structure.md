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

### Components (`components/`)

- `App.tsx` - Root component, orchestrates all hooks and views
- `RoomManager.tsx` - Lobby for creating/joining rooms
- `CasinoRoomView.tsx` - Waiting room before game starts
- `PokerTableView.tsx` - Main game table (round1/round2 phases)
- `GamePhases.tsx` - Handles special phases (cardSelection, dealing, finished)
- `Card.tsx` - Individual card component
- `Dealer.tsx` - Dealer/shuffle animations
- `GameActions.tsx` - Action buttons (capture, build, trail)
- `GameHints.tsx` - Hint system for valid moves
- `GameSettings.tsx` - Settings panel and preferences
- `PlayerHand.tsx` - Player's hand display
- `SoundSystem.tsx` - Audio management
- `ui/` - Reusable UI primitives (buttons, dialogs, etc.)
- `app/` - App-level components (header, decorations)

### Custom Hooks (`hooks/`)

State management is handled through custom hooks, not global state libraries:

- `useGameState.ts` - Core game state (cards, scores, phase)
- `useConnectionState.ts` - Connection status and errors
- `useWebSocket.ts` - WebSocket connection and message handling
- `useGameActions.ts` - Game action handlers (playCard, shuffle, etc.)
- `useRoomActions.ts` - Room management (create, join, leave)

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

App.tsx uses a **custom hooks pattern** for state management:
1. State hooks manage specific domains (game, connection, websocket)
2. Action hooks encapsulate business logic
3. Components remain presentational and receive props
4. No global state library - hooks compose together

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
- **Component Props**: Explicit prop interfaces, no prop drilling beyond 2 levels
- **API Client**: Centralized in `apiClient.ts`
- **Error Handling**: Errors displayed via connection state hook
- **Testing**: Test IDs use `data-testid` attribute
- **Styling**: TailwindCSS utility classes, custom casino theme colors
- **File Naming**: PascalCase for components, camelCase for utilities/hooks
