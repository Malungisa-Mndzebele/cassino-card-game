# Product Overview

Casino Card Game is a real-time multiplayer implementation of the classic Casino card game built with SvelteKit and FastAPI. Players compete head-to-head in matches where they capture cards from the table, build combinations, and score points. The game features WebSocket-based real-time synchronization, session management for reconnection handling, and comprehensive game state recovery.

## Core Features

- **Multiplayer Gameplay**: 2-player head-to-head matches with room-based matchmaking
- **Real-time Sync**: WebSocket connections for instant game state updates
- **Session Management**: Redis-based session persistence with automatic reconnection and state recovery
- **Action Logging**: Complete audit trail of all game actions for debugging and replay
- **Performance Optimization**: Redis caching for frequently accessed data
- **Background Tasks**: Automated session cleanup and connection monitoring
- **Game Mechanics**: Capture, build, and trail actions following traditional Casino rules
- **Scoring System**: Points for aces, special cards (2♠, 10♦), most cards, and most spades
- **Production Deployment**: Backend on Fly.io with PostgreSQL and Redis, frontend on khasinogaming.com

## Game Rules

Players score points by:
- Capturing aces (1 point each)
- Capturing 2 of Spades "Big Casino" (1 point)
- Capturing 10 of Diamonds "Little Casino" (2 points)
- Having most cards at end (2 points)
- Having most spades at end (2 points)

First player to 11 points wins. Game consists of 2 rounds with 4 cards dealt per player per round.

## Target Audience

Card game enthusiasts looking for online multiplayer experiences with friends.
