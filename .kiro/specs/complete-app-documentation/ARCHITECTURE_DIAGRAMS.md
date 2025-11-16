# Architecture Diagrams - Casino Card Game Application

This document contains comprehensive architecture diagrams for the Casino Card Game Application, including component hierarchy, data flow, WebSocket communication, and database schema visualizations.

## Table of Contents

1. [Component Hierarchy Diagram](#component-hierarchy-diagram)
2. [Data Flow Diagram](#data-flow-diagram)
3. [WebSocket Communication Flow](#websocket-communication-flow)
4. [Database Schema Diagram](#database-schema-diagram)
5. [State Management Flow](#state-management-flow)
6. [Deployment Architecture](#deployment-architecture)

---

## Component Hierarchy Diagram

### Frontend Component Tree

```mermaid
graph TD
    A[App.tsx - Root Component] --> B[SoundSystem]
    A --> C[Decor]
    A --> D[GameSettings Modal]
    A --> E[Statistics Display]
    A --> F[Error Display]
    A --> G{Connection State Router}
    
    G -->|Not Connected| H[RoomManager]
    H --> H1[Create Room Form]
    H --> H2[Join Room Form]
    H --> H3[Join Random Button]
    
    G -->|Connected - Waiting/Dealer| I[CasinoRoomView]
    I --> I1[Player Avatars]
    I --> I2[Ready Status Indicators]
    I --> I3[Ready/Not Ready Buttons]
    I --> I4[Shuffle Button]
    I --> I5[Room Code Display]
    
    G -->|Connected - Round1/Round2| J[PokerTableView]
    J --> J1[Dealer Component]
    J --> J2[PlayerHand - Current Player]
    J --> J3[PlayerHand - Opponent]
    J --> J4[Table Cards Display]
    J --> J5[Builds Display]
    J --> J6[Captured Piles Display]
    J --> J7[GameActions Component]
    J --> J8[Score Display]
    J --> J9[Turn Indicator]
    J --> J10[Leave Game Button]
    
    J7 --> J7A[Capture Button]
    J7 --> J7B[Build Button]
    J7 --> J7C[Trail Button]
    J7 --> J7D[GameHints]
    
    J2 --> K[Card Components]
    J3 --> K
    J4 --> K
    J5 --> K
    J6 --> K
    
    G -->|Connected - Other Phases| L[GamePhases]
    L --> L1[CardSelection Phase UI]
    L --> L2[Dealing Phase UI]
    L --> L3[Finished Phase UI]
    L --> L4[Reset Button]
    
    D --> M[Settings Controls]
    M --> M1[Sound Toggle]
    M --> M2[Volume Slider]
    M --> M3[Hints Toggle]
    M --> M4[Statistics Toggle]
    
    style A fill:#FFD700,stroke:#333,stroke-width:3px
    style G fill:#90EE90,stroke:#333,stroke-width:2px
    style J fill:#87CEEB,stroke:#333,stroke-width:2px
```

### Custom Hooks Architecture

```mermaid
graph LR
    A[App.tsx] --> B[useGameState]
    A --> C[useConnectionState]
    A --> D[useWebSocket]
    A --> E[useGameActions]
    A --> F[useRoomActions]
    A --> G[useGamePreferences]
    A --> H[useGameStatistics]
    
    B -->|Manages| B1[roomId<br/>playerId<br/>playerName<br/>gameState]
    C -->|Manages| C1[ws<br/>connectionStatus<br/>error<br/>isLoading]
    D -->|Uses| C
    D -->|Updates| B
    E -->|Uses| B
    E -->|Uses| C
    F -->|Uses| B
    F -->|Uses| C
    G -->|Manages| G1[localStorage<br/>preferences]
    H -->|Manages| H1[localStorage<br/>statistics]
    
    style A fill:#FFD700,stroke:#333,stroke-width:3px
    style B fill:#87CEEB,stroke:#333,stroke-width:2px
    style C fill:#87CEEB,stroke:#333,stroke-width:2px
    style D fill:#90EE90,stroke:#333,stroke-width:2px
```

---

## Data Flow Diagram

### Complete User Action Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant H as Hook
    participant API as API Client
    participant BE as Backend API
    participant DB as Database
    participant WS as WebSocket Manager
    participant C2 as Other Clients
    
    U->>C: Click "Play Card"
    C->>H: useGameActions.playCard()
    H->>H: Optimistic State Update
    H->>API: POST /game/play-card
    API->>BE: HTTP Request
    BE->>BE: Validate Move
    BE->>DB: Update Game State
    DB-->>BE: Confirmation
    BE->>WS: Broadcast Update
    WS->>C: WebSocket Message
    WS->>C2: WebSocket Message
    C->>H: applyResponseState()
    H->>H: Reconcile State
    H->>C: Trigger Re-render
    C->>U: Display Updated UI
    
    Note over H,BE: If validation fails
    BE-->>API: Error Response
    API-->>H: Error
    H->>H: Rollback State
    H->>C: Show Error
```

### Room Creation and Joining Flow

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant FE1 as Frontend 1
    participant BE as Backend
    participant DB as Database
    participant FE2 as Frontend 2
    participant P2 as Player 2
    
    P1->>FE1: Create Room
    FE1->>BE: POST /rooms/create
    BE->>DB: INSERT Room
    BE->>DB: INSERT Player 1
    DB-->>BE: Room Created
    BE-->>FE1: {roomId, playerId}
    FE1->>BE: WS Connect /ws/{roomId}
    BE-->>FE1: Connection Established
    FE1->>P1: Display Room Code
    
    P2->>FE2: Join Room (code)
    FE2->>BE: POST /rooms/join
    BE->>DB: INSERT Player 2
    BE->>DB: UPDATE Room Status
    DB-->>BE: Player Added
    BE-->>FE2: {roomId, playerId}
    FE2->>BE: WS Connect /ws/{roomId}
    BE->>FE1: WS: player_joined
    BE->>FE2: WS: game_state_update
    FE1->>P1: Show Player 2 Joined
    FE2->>P2: Show Game Room
```

### Game State Synchronization Flow

```mermaid
flowchart TD
    A[Game Action Triggered] --> B{Action Type}
    B -->|Capture| C[Validate Capture]
    B -->|Build| D[Validate Build]
    B -->|Trail| E[Validate Trail]
    
    C --> F{Valid?}
    D --> F
    E --> F
    
    F -->|No| G[Return Error]
    F -->|Yes| H[Execute Action]
    
    H --> I[Update Database]
    I --> J[Calculate New State]
    J --> K[Log Action]
    K --> L[Broadcast to WebSocket]
    
    L --> M[Client 1 Receives]
    L --> N[Client 2 Receives]
    
    M --> O[Update Local State]
    N --> O
    
    O --> P[Re-render UI]
    
    G --> Q[Display Error Message]
    
    style F fill:#FFD700,stroke:#333,stroke-width:2px
    style H fill:#90EE90,stroke:#333,stroke-width:2px
    style L fill:#87CEEB,stroke:#333,stroke-width:2px
```

---

## WebSocket Communication Flow

### WebSocket Connection Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Disconnected
    Disconnected --> Connecting: User Joins Room
    Connecting --> Connected: WS Open
    Connecting --> Disconnected: Connection Failed
    
    Connected --> Disconnected: Connection Lost
    Connected --> Connected: Heartbeat (30s)
    Connected --> Connected: Receive Message
    Connected --> Connected: Send Message
    
    Disconnected --> Reconnecting: Auto Reconnect
    Reconnecting --> Connected: Reconnect Success
    Reconnecting --> Disconnected: Max Retries
    
    Connected --> [*]: User Leaves
    Disconnected --> [*]: User Closes Tab
```

### WebSocket Message Types

```mermaid
graph TD
    A[WebSocket Messages] --> B[Server to Client]
    A --> C[Client to Server]
    
    B --> B1[game_state_update]
    B --> B2[player_joined]
    B --> B3[player_ready]
    B --> B4[player_disconnected]
    B --> B5[error]
    B --> B6[heartbeat_response]
    
    C --> C1[heartbeat]
    C --> C2[state_request]
    
    B1 --> D1[Full GameState Object]
    B2 --> D2[player_id, player_name]
    B3 --> D3[player_id, ready: boolean]
    B4 --> D4[player_id]
    B5 --> D5[message: string]
    B6 --> D6[timestamp]
    
    C1 --> E1[timestamp]
    C2 --> E2[Empty or minimal data]
    
    style A fill:#FFD700,stroke:#333,stroke-width:3px
    style B fill:#87CEEB,stroke:#333,stroke-width:2px
    style C fill:#90EE90,stroke:#333,stroke-width:2px
```

### Reconnection Strategy

```mermaid
flowchart TD
    A[Connection Lost] --> B[Attempt = 0]
    B --> C{Attempt < 5?}
    C -->|No| D[Show Error: Max Retries]
    C -->|Yes| E[Wait Delay]
    E --> F[Delay = 2^Attempt seconds]
    F --> G[Attempt Reconnect]
    G --> H{Success?}
    H -->|Yes| I[Restore Session]
    H -->|No| J[Attempt++]
    J --> C
    
    I --> K[Send Session Token]
    K --> L[Receive Current State]
    L --> M[Update UI]
    M --> N[Connected]
    
    style A fill:#FF6B6B,stroke:#333,stroke-width:2px
    style N fill:#90EE90,stroke:#333,stroke-width:2px
    style D fill:#FF6B6B,stroke:#333,stroke-width:2px
```

### Session Management Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket
    participant SM as Session Manager
    participant DB as Database
    
    C->>WS: Connect to Room
    WS->>SM: Create Session
    SM->>DB: INSERT GameSession
    SM->>SM: Generate Token
    SM-->>C: Return Session Token
    C->>C: Store in localStorage
    
    loop Every 30 seconds
        C->>WS: Heartbeat
        WS->>SM: Update Heartbeat
        SM->>DB: UPDATE last_heartbeat
    end
    
    Note over C,WS: Connection Lost
    
    C->>C: Wait (reconnect delay)
    C->>WS: Reconnect with Token
    WS->>SM: Validate Session
    SM->>DB: Query Session
    DB-->>SM: Session Valid
    SM->>SM: Restore State
    SM-->>C: Current Game State
    C->>C: Resume Game
```

---

## Database Schema Diagram

### Entity Relationship Diagram

```mermaid
erDiagram
    ROOMS ||--o{ PLAYERS : contains
    ROOMS ||--o{ GAME_SESSIONS : tracks
    ROOMS ||--o{ GAME_ACTION_LOG : records
    PLAYERS ||--o{ GAME_SESSIONS : has
    PLAYERS ||--o{ GAME_ACTION_LOG : performs
    
    ROOMS {
        string id PK "6-char code"
        timestamp created_at
        string status "waiting|active|finished"
        string game_phase "waiting|dealer|round1|round2|finished"
        int current_turn "1 or 2"
        int round_number "0, 1, or 2"
        json deck
        json player1_hand
        json player2_hand
        json table_cards
        json builds
        json player1_captured
        json player2_captured
        int player1_score
        int player2_score
        boolean shuffle_complete
        boolean card_selection_complete
        boolean dealing_complete
        boolean game_started
        boolean game_completed
        boolean player1_ready
        boolean player2_ready
        json last_play
        string last_action
        timestamp last_update
        int winner "1, 2, or NULL"
    }
    
    PLAYERS {
        int id PK
        string room_id FK
        string name
        boolean ready
        timestamp joined_at
        string ip_address
    }
    
    GAME_SESSIONS {
        string id PK "UUID"
        string room_id FK
        int player_id FK
        string session_token UK "SHA-256 hash"
        timestamp connected_at
        timestamp last_heartbeat
        timestamp disconnected_at
        timestamp reconnected_at
        boolean is_active
        int connection_count
        string ip_address
        string user_agent
    }
    
    GAME_ACTION_LOG {
        int id PK
        string room_id FK
        int player_id FK
        string action_type "capture|build|trail|shuffle|deal"
        json action_data
        timestamp timestamp
        int sequence_number
        string action_id UK "Deduplication"
    }
```

### Database Indexes

```mermaid
graph TD
    A[Database Indexes] --> B[ROOMS Table]
    A --> C[PLAYERS Table]
    A --> D[GAME_SESSIONS Table]
    A --> E[GAME_ACTION_LOG Table]
    
    B --> B1[PRIMARY: id]
    B --> B2[INDEX: status]
    B --> B3[INDEX: game_phase]
    B --> B4[INDEX: last_update]
    
    C --> C1[PRIMARY: id]
    C --> C2[INDEX: room_id]
    C --> C3[INDEX: joined_at]
    
    D --> D1[PRIMARY: id]
    D --> D2[UNIQUE: session_token]
    D --> D3[INDEX: room_id]
    D --> D4[INDEX: player_id]
    D --> D5[INDEX: is_active]
    D --> D6[INDEX: last_heartbeat]
    
    E --> E1[PRIMARY: id]
    E --> E2[UNIQUE: action_id]
    E --> E3[INDEX: room_id]
    E --> E4[INDEX: player_id]
    E --> E5[INDEX: timestamp]
    E --> E6[INDEX: sequence_number]
    
    style A fill:#FFD700,stroke:#333,stroke-width:3px
```

---

## State Management Flow

### Frontend State Architecture

```mermaid
graph TB
    A[App Component State] --> B[Game State]
    A --> C[Connection State]
    A --> D[UI State]
    
    B --> B1[roomId]
    B --> B2[playerId]
    B --> B3[playerName]
    B --> B4[gameState Object]
    B --> B5[previousGameState]
    
    C --> C1[ws: WebSocket]
    C --> C2[connectionStatus]
    C --> C3[error]
    C --> C4[isLoading]
    C --> C5[soundReady]
    
    D --> D1[selectedCard]
    D --> D2[selectedTargets]
    D --> D3[buildValue]
    D --> D4[showSettings]
    D --> D5[countdown]
    
    B4 --> E[GameState Properties]
    E --> E1[players: Player array]
    E --> E2[phase: GamePhase]
    E --> E3[round: number]
    E --> E4[deck: Card array]
    E --> E5[hands: Card arrays]
    E --> E6[tableCards: Card array]
    E --> E7[builds: Build array]
    E --> E8[captured: Card arrays]
    E --> E9[scores: numbers]
    E --> E10[currentTurn: number]
    E --> E11[flags: booleans]
    E --> E12[lastPlay: object]
    E --> E13[winner: number or null]
    
    style A fill:#FFD700,stroke:#333,stroke-width:3px
    style B fill:#87CEEB,stroke:#333,stroke-width:2px
    style C fill:#90EE90,stroke:#333,stroke-width:2px
```

### State Update Patterns

```mermaid
flowchart LR
    A[User Action] --> B[Component Handler]
    B --> C[Hook Function]
    C --> D{Optimistic Update?}
    D -->|Yes| E[Update Local State]
    D -->|No| F[API Call]
    E --> F
    F --> G{Success?}
    G -->|Yes| H[Server Response]
    G -->|No| I[Error Handler]
    H --> J[WebSocket Broadcast]
    J --> K[All Clients Receive]
    K --> L[applyResponseState]
    L --> M{State Conflict?}
    M -->|Yes| N[Server Wins]
    M -->|No| O[Merge State]
    N --> P[Update UI]
    O --> P
    I --> Q[Rollback State]
    Q --> R[Show Error]
    
    style D fill:#FFD700,stroke:#333,stroke-width:2px
    style M fill:#FFD700,stroke:#333,stroke-width:2px
    style P fill:#90EE90,stroke:#333,stroke-width:2px
```

---

## Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    subgraph Internet
        U[Users/Browsers]
    end
    
    subgraph Frontend Hosting
        CDN[Web Server<br/>khasinogaming.com/cassino/]
        STATIC[Static Assets<br/>HTML, CSS, JS, Images]
    end
    
    subgraph Fly.io Platform
        LB[Load Balancer<br/>cassino-game-backend.fly.dev]
        
        subgraph Backend Instances
            BE1[FastAPI Instance 1<br/>Port 8000]
            BE2[FastAPI Instance 2<br/>Port 8000]
        end
        
        subgraph Database
            PG[(PostgreSQL<br/>Managed Database)]
        end
    end
    
    subgraph CI/CD
        GH[GitHub Actions]
        GH1[Backend Deploy Workflow]
        GH2[Frontend Deploy Workflow]
        GH3[Test Workflow]
    end
    
    U -->|HTTPS| CDN
    U -->|WSS/HTTPS| LB
    CDN --> STATIC
    LB --> BE1
    LB --> BE2
    BE1 --> PG
    BE2 --> PG
    
    GH --> GH1
    GH --> GH2
    GH --> GH3
    GH1 -->|Deploy| BE1
    GH1 -->|Deploy| BE2
    GH2 -->|FTP| CDN
    
    style U fill:#87CEEB,stroke:#333,stroke-width:2px
    style CDN fill:#90EE90,stroke:#333,stroke-width:2px
    style LB fill:#FFD700,stroke:#333,stroke-width:2px
    style PG fill:#FF6B6B,stroke:#333,stroke-width:2px
```

### Request Flow in Production

```mermaid
sequenceDiagram
    participant B as Browser
    participant CDN as Web Server
    participant LB as Fly.io Load Balancer
    participant BE as Backend Instance
    participant DB as PostgreSQL
    
    Note over B,CDN: Initial Page Load
    B->>CDN: GET /cassino/
    CDN-->>B: index.html
    B->>CDN: GET /cassino/assets/*
    CDN-->>B: JS, CSS, Images
    
    Note over B,LB: API Requests
    B->>LB: POST /rooms/create
    LB->>BE: Forward Request
    BE->>DB: INSERT Room
    DB-->>BE: Success
    BE-->>LB: Response
    LB-->>B: Room Data
    
    Note over B,BE: WebSocket Connection
    B->>LB: WSS /ws/{roomId}
    LB->>BE: Upgrade Connection
    BE-->>B: WebSocket Established
    
    loop Real-time Updates
        BE->>B: Game State Update
        B->>BE: Heartbeat
    end
```

### Environment Configuration

```mermaid
graph LR
    subgraph Development
        D1[.env]
        D2[SQLite DB]
        D3[localhost:5173]
        D4[localhost:8000]
    end
    
    subgraph Production
        P1[Fly.io Secrets]
        P2[PostgreSQL]
        P3[khasinogaming.com]
        P4[cassino-game-backend.fly.dev]
    end
    
    D1 --> D2
    D1 --> D3
    D1 --> D4
    D3 -->|API Calls| D4
    
    P1 --> P2
    P1 --> P4
    P3 -->|API Calls| P4
    P4 --> P2
    
    style D1 fill:#87CEEB,stroke:#333,stroke-width:2px
    style P1 fill:#90EE90,stroke:#333,stroke-width:2px
```

---

## Summary

These architecture diagrams provide a comprehensive visual representation of the Casino Card Game Application's structure, including:

1. **Component Hierarchy**: Shows the React component tree and custom hooks architecture
2. **Data Flow**: Illustrates how data moves through the system from user actions to UI updates
3. **WebSocket Communication**: Details the real-time communication patterns and reconnection logic
4. **Database Schema**: Visualizes the entity relationships and indexing strategy
5. **State Management**: Explains how state is managed and synchronized across the application
6. **Deployment Architecture**: Shows the production infrastructure and request flow

These diagrams serve as essential documentation for understanding the system architecture, onboarding new developers, and planning future enhancements.
