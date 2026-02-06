# Casino Card Game Documentation

This directory contains all project documentation organized by category.

## 📸 Game Preview

<p align="center">
  <img src="images/game_landing_page.png" alt="Casino Card Game Lobby" width="600">
</p>

## 📁 Directory Structure

### `/images`
Screenshots and visual assets for documentation.

- **game-lobby.png** - Screenshot of the game lobby/home screen

### `/deployment`
Documentation related to deploying the application to production environments.

- **RENDER_QUICK_START.md** - Quick guide to deploying on Render
- **RENDER_DEPLOYMENT_STATUS.md** - Current deployment status and configuration
- **DEPLOYMENT_SUMMARY.md** - Overview of deployment architecture
- **check-render-deployment.md** - Deployment verification checklist

### `/development`
Documentation for setting up and running the development environment.

- **QUICK_START.md** - Get started with development quickly
- **START_SERVERS.md** - How to start backend and frontend servers
- **BACKEND_SETUP.md** - Backend setup and configuration guide
- **CONFLICT_RESOLVER.md** - Conflict resolution system documentation
- **SECURITY_VALIDATIONS.md** - Security validation implementation details

### `/testing`
Documentation about testing strategies, test results, and testing guides.

- **TESTING_QUICK_GUIDE.md** - Quick reference for running tests
- **TESTING_INSTRUCTIONS_FINAL.md** - Comprehensive testing instructions
- **E2E_TEST_RESULTS.md** - End-to-end test results
- **PRODUCTION_E2E_TEST_RESULTS.md** - Production environment test results

## 🔗 Additional Resources

- **Main README** - See [../README.md](../README.md) for project overview
- **Specs** - See [../.kiro/specs/](../.kiro/specs/) for feature specifications
- **Steering Rules** - See [../.kiro/steering/](../.kiro/steering/) for development guidelines
- **API Documentation** - See [../backend/API.md](../backend/API.md) for API reference

## 🎮 Key Features

### Game Features
- Real-time multiplayer Casino card game
- Drag-and-drop card building
- WebSocket-based state synchronization
- Session persistence and reconnection
- Voice chat support (WebRTC)

### Technical Features
- Service layer architecture (RoomService, GameService, PlayerService)
- Redis-based session management and caching
- Action logging for state recovery
- Version-based conflict resolution
- Comprehensive test coverage

## 📝 Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate subdirectory
2. Update this README with a link and description
3. Use clear, descriptive filenames
4. Follow markdown best practices
