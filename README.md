# 🎮 Casino Card Game

A real-time multiplayer implementation of the classic Cassino card game built with React, TypeScript, and FastAPI with PostgreSQL database and Docker containerization.

![Casino Card Game](https://via.placeholder.com/800x400/065f46/ffffff?text=Casino+Card+Game)

## 🎯 About

This is a faithful digital recreation of the traditional Cassino card game featuring:
- **Real-time multiplayer** gameplay for 2 players
- **Complete rule implementation** with proper building/capturing mechanics
- **11-point scoring system** (Aces, 2♠, 10♦, most cards, most spades)
- **Sound effects** and visual feedback
- **Hints system** with strategic suggestions
- **Game statistics** tracking
- **Mobile-responsive** design
- **Docker containerization** for easy deployment
- **PostgreSQL database** for production reliability

## 🚀 Live Demo

Play the game at: **[https://khasinogaming.com/cassino/](https://khasinogaming.com/cassino/)**

## 🎲 How to Play

### Game Setup
1. Player 1 creates a room and shares the room code
2. Player 2 joins using the room code
3. Both players click "I'm Ready!" to start
4. Player 1 instructs dealer to shuffle the deck
5. Player 1 selects 4 cards for the table
6. Dealer distributes 4 cards to each player
7. Game begins with two rounds of play

### Gameplay Actions
- **Capture**: Match your card value with table cards
- **Build**: Combine table cards with your card to create a sum you can capture
- **Trail**: Place a card on the table when you can't capture or build

### Important Rule
🚨 **You can only build values that you have cards in hand to capture!**

### Scoring (11 points total)
- Each Ace: 1 point (4 total)
- 2 of Spades: 1 point
- 10 of Diamonds: 2 points
- Most cards captured: 2 points (1 each if tied)
- Most spades captured: 2 points (1 each if tied)

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **Web Audio API** for sound effects

### Backend
- **FastAPI** with Python 3.11
- **PostgreSQL** database (production) / SQLite (development)
- **SQLAlchemy** ORM
- **Alembic** for database migrations
- **WebSocket** support for real-time updates

### Infrastructure
- **Docker** and **Docker Compose** for containerization
- **Nginx** reverse proxy (optional)
- **pgAdmin** for database management

## 📁 Project Structure

```
Multiplayer Card Game/
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── Card.tsx            # Card display component
│   ├── GamePhases.tsx      # Game phase management
│   ├── GameActions.tsx     # Player action handling
│   ├── RoomManager.tsx     # Room creation and joining
│   └── ...
├── backend/                # FastAPI backend
│   ├── main.py             # Main FastAPI application
│   ├── models.py           # SQLAlchemy models
│   ├── database.py         # Database configuration
│   ├── schemas.py          # Pydantic schemas
│   ├── alembic/            # Database migrations
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend Docker image
│   └── ...
├── docker-compose.yml      # Production Docker setup
├── docker-compose.dev.yml  # Development Docker setup
├── docker-compose.prod.yml # Production deployment
├── deploy-prod.bat         # Windows deployment script
├── deploy-prod.sh          # Linux/macOS deployment script
├── tests/                  # Test files
├── public/                 # Static assets
└── ...
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

#### Development Environment
```bash
# Start development environment
./start-app.sh dev    # Linux/macOS
# OR
start-app.bat dev     # Windows

# Access the application
# Frontend: http://localhost:3000/cassino/
# Backend: http://localhost:8000
# pgAdmin: http://localhost:8080
```

#### Production Deployment
```bash
# Deploy to production
./deploy-prod.sh      # Linux/macOS
# OR
deploy-prod.bat       # Windows

# Access the application
# Backend: http://localhost:8000
# Health check: http://localhost:8000/health
```

### Option 2: Local Development

#### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (for production) or SQLite (for development)

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

#### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Set up environment variables
cp env.example .env
# Edit .env with your database configuration

# Run database migrations
alembic upgrade head

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 🐳 Docker Setup

### Development Stack
The development environment includes:
- **Frontend**: React with hot reload
- **Backend**: FastAPI with auto-reload
- **Database**: PostgreSQL with pgAdmin
- **Network**: Isolated Docker network

### Production Stack
The production environment includes:
- **Backend**: FastAPI with PostgreSQL
- **Health checks**: Automatic monitoring
- **Restart policies**: Automatic recovery
- **Volume persistence**: Database data preservation

### Management Commands
```bash
# Start development environment
./start-app.sh dev

# Start production environment
./deploy-prod.sh

# Stop all services
./stop-app.sh

# View logs
./logs.sh

# Clean up (remove all data)
./clean-app.sh
```

## 🗄️ Database Setup

### Local Development
```bash
# Start PostgreSQL with Docker
cd backend
./start_local.sh    # Linux/macOS
# OR
start_local.bat     # Windows

# Connect to pgAdmin
# URL: http://localhost:8080
# Email: admin@casino.com
# Password: admin123
```

### Production
The production deployment automatically:
- Creates PostgreSQL container
- Runs database migrations
- Sets up proper networking
- Configures health checks

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run backend tests
cd backend
python -m pytest
```

### Test Coverage
- ✅ Frontend component tests
- ✅ Backend API tests
- ✅ Game logic tests
- ✅ Database integration tests
- ✅ Docker deployment tests

## 📦 Deployment

### Production Deployment Options

#### 1. Docker (Recommended)

#### 2. Render.com
```bash
# Deploy with Docker
./deploy-prod.sh
```

#### 3. Manual Server Deployment
Follow the instructions in `PRODUCTION_DEPLOYMENT.md`

### Environment Variables

#### Frontend
```bash
VITE_API_URL=https://your-backend-url.com
```

#### Backend
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
CORS_ORIGINS=https://your-domain.com
PORT=8000
HOST=0.0.0.0
```

## 🔧 Configuration

### Database Switching
```bash
# Switch between PostgreSQL and SQLite
cd backend
python switch_db.py
```

### CORS Configuration
Update `backend/main.py` to include your frontend domain:
```python
CORS_ORIGINS=["https://your-domain.com"]
```

## 🐛 Troubleshooting

### Common Issues

#### Connection Timeout
- Check if backend is running: `curl http://localhost:8000/health`
- Verify Docker containers: `docker ps`
- Check logs: `docker-compose logs backend`

#### Database Issues
- Run migrations: `alembic upgrade head`
- Check database connection
- Verify environment variables

#### CORS Errors
- Update CORS_ORIGINS in backend configuration
- Ensure frontend domain is included

### Getting Help
1. Check the logs: `./logs.sh`
2. Review `DOCKER_SETUP.md` for detailed instructions
3. Check `PRODUCTION_DEPLOYMENT.md` for deployment issues
4. Open an issue on GitHub

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow the existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Test with Docker deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Traditional Cassino card game rules
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [FastAPI](https://fastapi.tiangolo.com/) for robust backend
- [Docker](https://www.docker.com/) for containerization
- [PostgreSQL](https://www.postgresql.org/) for reliable database

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the documentation in `DOCKER_SETUP.md` and `PRODUCTION_DEPLOYMENT.md`
3. Open an issue on GitHub
4. Check the logs: `./logs.sh`

---

**🎮 Enjoy playing Cassino!** 

*Made with ❤️ for card game enthusiasts worldwide.*