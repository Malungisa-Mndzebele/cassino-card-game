# 🎮 Cassino Card Game

A real-time multiplayer implementation of the classic Cassino card game built with React, TypeScript, and Supabase.

![Cassino Card Game](https://via.placeholder.com/800x400/065f46/ffffff?text=Cassino+Card+Game)

## 🎯 About

This is a faithful digital recreation of the traditional Cassino card game featuring:
- **Real-time multiplayer** gameplay for 2 players
- **Complete rule implementation** with proper building/capturing mechanics
- **11-point scoring system** (Aces, 2♠, 10♦, most cards, most spades)
- **Sound effects** and visual feedback
- **Hints system** with strategic suggestions
- **Game statistics** tracking
- **Mobile-responsive** design

## 🚀 Live Demo

Play the game at: **[https://khasinogaming.com/cassino](https://khasinogaming.com/cassino)**

## 🎲 How to Play

### Game Setup
1. Player 1 creates a room and shares the room code
2. Player 2 joins using the room code
3. Player 1 instructs dealer to shuffle the deck
4. Player 1 selects 4 cards for the table
5. Dealer distributes 4 cards to each player
6. Game begins with two rounds of play

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

- **Frontend**: React 18, TypeScript, Tailwind CSS v4
- **Backend**: Supabase Edge Functions (Hono.js)
- **Database**: Supabase PostgreSQL with KV store
- **Real-time**: Supabase real-time subscriptions
- **Build Tool**: Vite
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Sound**: Web Audio API

## 📁 Project Structure

```
cassino-card-game/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── Card.tsx        # Card display component
│   ├── GamePhases.tsx  # Game phase management
│   ├── GameActions.tsx # Player action handling
│   └── ...
├── supabase/
│   └── functions/
│       └── server/     # Edge function backend
├── utils/
│   └── supabase/       # Supabase configuration
├── styles/             # Global CSS and Tailwind config
└── public/             # Static assets
```

## 🔧 Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cassino-card-game.git
   cd cassino-card-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a new Supabase project
   - Update `/utils/supabase/info.tsx` with your project details:
   ```typescript
   export const projectId = 'your-project-id'
   export const publicAnonKey = 'your-anon-key'
   ```

4. **Deploy the Edge Function**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login and link project
   supabase login
   supabase link --project-ref your-project-id
   
   # Deploy the server function
   supabase functions deploy server
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📦 Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with production-ready files.

### Deploy to Web Hosting

1. Upload the contents of `dist/` to your web server
2. Ensure HTTPS is enabled (required for Supabase)
3. Configure proper MIME types for `.js` and `.css` files

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## 🎮 Game Features

### Core Gameplay
- ✅ Complete Cassino rule implementation
- ✅ Real-time multiplayer synchronization
- ✅ Proper build validation (must have capturing card)
- ✅ Turn-based gameplay with countdown timers
- ✅ Card combination validation

### User Experience
- ✅ Responsive design (desktop & mobile)
- ✅ Sound effects with volume control
- ✅ Visual feedback for all actions
- ✅ Hint system with strategic suggestions
- ✅ Game statistics tracking
- ✅ Settings panel with preferences

### Technical Features
- ✅ Real-time state synchronization
- ✅ Error handling and recovery
- ✅ Performance optimizations
- ✅ SEO optimization
- ✅ PWA capabilities

## 🐛 Known Issues

- None currently reported

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Traditional Cassino card game rules
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Supabase](https://supabase.com/) for backend infrastructure
- [Lucide](https://lucide.dev/) for icons

## 📞 Support

If you encounter any issues or have questions:

1. Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for common solutions
2. Open an issue on GitHub
3. Contact: [your-email@example.com](mailto:your-email@example.com)

---

**🎮 Enjoy playing Cassino!** 

*Made with ❤️ for card game enthusiasts worldwide.*