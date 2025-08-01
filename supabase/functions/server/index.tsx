import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/middleware'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Card deck setup
const suits = ['hearts', 'diamonds', 'clubs', 'spades']
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function createDeck() {
  const deck = []
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, id: `${rank}_${suit}` })
    }
  }
  return shuffleDeck(deck)
}

function shuffleDeck(deck: any[]) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getCardValue(rank: string): number {
  if (rank === 'A') return 14  // Ace is high value for building
  if (rank === 'K') return 13
  if (rank === 'Q') return 12
  if (rank === 'J') return 11
  return parseInt(rank)
}

function calculateScores(gameState: any) {
  const player1Cards = gameState.player1Captured || []
  const player2Cards = gameState.player2Captured || []
  
  let player1Score = 0
  let player2Score = 0
  
  // Count Aces (1 point each)
  const player1Aces = player1Cards.filter((card: any) => card.rank === 'A').length
  const player2Aces = player2Cards.filter((card: any) => card.rank === 'A').length
  player1Score += player1Aces
  player2Score += player2Aces
  
  // 2 of Spades (1 point)
  const has2Spades1 = player1Cards.some((card: any) => card.rank === '2' && card.suit === 'spades')
  const has2Spades2 = player2Cards.some((card: any) => card.rank === '2' && card.suit === 'spades')
  if (has2Spades1) player1Score += 1
  if (has2Spades2) player2Score += 1
  
  // 10 of Diamonds (2 points)
  const has10Diamonds1 = player1Cards.some((card: any) => card.rank === '10' && card.suit === 'diamonds')
  const has10Diamonds2 = player2Cards.some((card: any) => card.rank === '10' && card.suit === 'diamonds')
  if (has10Diamonds1) player1Score += 2
  if (has10Diamonds2) player2Score += 2
  
  // Most cards (2 points, 1 each if tied)
  if (player1Cards.length > player2Cards.length) {
    player1Score += 2
  } else if (player2Cards.length > player1Cards.length) {
    player2Score += 2
  } else if (player1Cards.length === player2Cards.length && player1Cards.length > 0) {
    player1Score += 1
    player2Score += 1
  }
  
  // Most spades (2 points, 1 each if tied)
  const player1Spades = player1Cards.filter((card: any) => card.suit === 'spades').length
  const player2Spades = player2Cards.filter((card: any) => card.suit === 'spades').length
  if (player1Spades > player2Spades) {
    player1Score += 2
  } else if (player2Spades > player1Spades) {
    player2Score += 2
  } else if (player1Spades === player2Spades && player1Spades > 0) {
    player1Score += 1
    player2Score += 1
  }
  
  return { player1Score, player2Score }
}

// Create a new game room
app.post('/make-server-48645a41/create-room', async (c) => {
  try {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const deck = createDeck()
    
    const gameState = {
      roomId,
      players: [],
      deck,
      player1Hand: [],
      player2Hand: [],
      tableCards: [], // Cards currently on the table (4 initial + any played)
      builds: [], // Current builds on the table
      player1Captured: [], // Cards captured by player 1
      player2Captured: [], // Cards captured by player 2
      currentTurn: 1,
      phase: 'waiting', // waiting, countdown, shuffling, cardSelection, dealing, round1, dealingRound2, round2, finished
      round: 0,
      countdownStartTime: null,
      gameStarted: false,
      shuffleComplete: false,
      cardSelectionComplete: false,
      dealingComplete: false,
      player1Score: 0,
      player2Score: 0,
      winner: null,
      lastPlay: null, // Last action taken by a player
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    }
    
    await kv.set(`game:${roomId}`, gameState)
    
    return c.json({ success: true, roomId, gameState })
  } catch (error) {
    console.log('Error creating room:', error)
    return c.json({ error: 'Failed to create room', details: error.message }, 500)
  }
})

// Join a game room
app.post('/make-server-48645a41/join-room', async (c) => {
  try {
    const { roomId, playerName } = await c.req.json()
    
    const gameState = await kv.get(`game:${roomId}`)
    if (!gameState) {
      return c.json({ error: 'Room not found' }, 404)
    }
    
    if (gameState.players.length >= 2) {
      return c.json({ error: 'Room is full' }, 400)
    }
    
    const playerId = gameState.players.length + 1
    gameState.players.push({ id: playerId, name: playerName || `Player ${playerId}` })
    gameState.lastUpdate = new Date().toISOString()
    
    // Start countdown when 2 players join
    if (gameState.players.length === 2) {
      gameState.phase = 'countdown'
      gameState.countdownStartTime = new Date().toISOString()
    }
    
    await kv.set(`game:${roomId}`, gameState)
    
    return c.json({ success: true, playerId, gameState })
  } catch (error) {
    console.log('Error joining room:', error)
    return c.json({ error: 'Failed to join room', details: error.message }, 500)
  }
})

// Start shuffle (Player 1 instructs dealer)
app.post('/make-server-48645a41/start-shuffle', async (c) => {
  try {
    const { roomId, playerId } = await c.req.json()
    
    const gameState = await kv.get(`game:${roomId}`)
    if (!gameState) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    if (playerId !== 1) {
      return c.json({ error: 'Only Player 1 can start the shuffle' }, 400)
    }
    
    if (gameState.phase !== 'countdown') {
      return c.json({ error: 'Cannot shuffle at this time' }, 400)
    }
    
    // Check if countdown has finished (30 seconds)
    const countdownStart = new Date(gameState.countdownStartTime)
    const now = new Date()
    const elapsed = (now.getTime() - countdownStart.getTime()) / 1000
    
    if (elapsed < 30) {
      return c.json({ error: 'Countdown not finished yet' }, 400)
    }
    
    gameState.phase = 'shuffling'
    gameState.deck = shuffleDeck(gameState.deck) // Shuffle the deck
    gameState.lastUpdate = new Date().toISOString()
    
    // Auto-complete shuffle after 3 seconds
    setTimeout(async () => {
      const currentGameState = await kv.get(`game:${roomId}`)
      if (currentGameState && currentGameState.phase === 'shuffling') {
        currentGameState.phase = 'cardSelection'
        currentGameState.shuffleComplete = true
        currentGameState.lastUpdate = new Date().toISOString()
        await kv.set(`game:${roomId}`, currentGameState)
      }
    }, 3000)
    
    await kv.set(`game:${roomId}`, gameState)
    
    return c.json({ success: true, gameState })
  } catch (error) {
    console.log('Error starting shuffle:', error)
    return c.json({ error: 'Failed to start shuffle', details: error.message }, 500)
  }
})

// Select face-up cards (Player 1 selects 4 cards for the table)
app.post('/make-server-48645a41/select-face-up-cards', async (c) => {
  try {
    const { roomId, playerId, cardIds } = await c.req.json()
    
    const gameState = await kv.get(`game:${roomId}`)
    if (!gameState) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    if (playerId !== 1) {
      return c.json({ error: 'Only Player 1 can select face-up cards' }, 400)
    }
    
    if (gameState.phase !== 'cardSelection') {
      return c.json({ error: 'Cannot select cards at this time' }, 400)
    }
    
    if (!cardIds || cardIds.length !== 4) {
      return c.json({ error: 'Must select exactly 4 cards' }, 400)
    }
    
    // Remove selected cards from deck and add to table
    gameState.tableCards = []
    for (const cardId of cardIds) {
      const cardIndex = gameState.deck.findIndex(card => card.id === cardId)
      if (cardIndex === -1) {
        return c.json({ error: 'Card not found in deck' }, 400)
      }
      const card = gameState.deck.splice(cardIndex, 1)[0]
      gameState.tableCards.push(card)
    }
    
    gameState.phase = 'dealing'
    gameState.cardSelectionComplete = true
    gameState.lastUpdate = new Date().toISOString()
    
    // Auto-deal cards after 2 seconds
    setTimeout(async () => {
      const currentGameState = await kv.get(`game:${roomId}`)
      if (currentGameState && currentGameState.phase === 'dealing') {
        // Deal 4 cards to each player for first round
        currentGameState.player1Hand = []
        currentGameState.player2Hand = []
        
        for (let i = 0; i < 8; i++) {
          if (currentGameState.deck.length > 0) {
            const card = currentGameState.deck.pop()
            if (i % 2 === 0) {
              currentGameState.player1Hand.push(card)
            } else {
              currentGameState.player2Hand.push(card)
            }
          }
        }
        
        currentGameState.phase = 'round1'
        currentGameState.round = 1
        currentGameState.gameStarted = true
        currentGameState.dealingComplete = true
        currentGameState.currentTurn = 1 // Player 1 starts
        currentGameState.lastUpdate = new Date().toISOString()
        await kv.set(`game:${roomId}`, currentGameState)
      }
    }, 2000)
    
    await kv.set(`game:${roomId}`, gameState)
    
    return c.json({ success: true, gameState })
  } catch (error) {
    console.log('Error selecting face-up cards:', error)
    return c.json({ error: 'Failed to select face-up cards', details: error.message }, 500)
  }
})

// Play a card
app.post('/make-server-48645a41/play-card', async (c) => {
  try {
    const { roomId, playerId, cardId, action, targetCards, buildValue } = await c.req.json()
    
    const gameState = await kv.get(`game:${roomId}`)
    if (!gameState) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    if (gameState.phase !== 'round1' && gameState.phase !== 'round2') {
      return c.json({ error: 'Not in playing phase' }, 400)
    }
    
    if (gameState.currentTurn !== playerId) {
      return c.json({ error: 'Not your turn' }, 400)
    }
    
    // Find and validate card in player's hand
    const playerHand = playerId === 1 ? gameState.player1Hand : gameState.player2Hand
    const cardIndex = playerHand.findIndex(card => card.id === cardId)
    
    if (cardIndex === -1) {
      return c.json({ error: 'Card not found in hand' }, 400)
    }
    
    const playedCard = playerHand[cardIndex]
    const playedCardValue = getCardValue(playedCard.rank)
    
    if (action === 'capture') {
      // Capture cards from table that sum to the played card value
      let captureValue = 0
      const cardsToCapture = []
      
      for (const targetCardId of targetCards || []) {
        const tableCard = gameState.tableCards.find(card => card.id === targetCardId)
        if (tableCard) {
          captureValue += getCardValue(tableCard.rank)
          cardsToCapture.push(tableCard)
        }
      }
      
      if (captureValue !== playedCardValue) {
        return c.json({ error: 'Capture value must match played card value' }, 400)
      }
      
      // Remove captured cards from table
      for (const card of cardsToCapture) {
        const index = gameState.tableCards.findIndex(c => c.id === card.id)
        if (index !== -1) {
          gameState.tableCards.splice(index, 1)
        }
      }
      
      // Add captured cards and played card to player's captured pile
      const capturedPile = playerId === 1 ? gameState.player1Captured : gameState.player2Captured
      capturedPile.push(playedCard, ...cardsToCapture)
      
      gameState.lastPlay = {
        playerId,
        action: 'capture',
        card: playedCard,
        capturedCards: cardsToCapture,
        value: captureValue
      }
      
    } else if (action === 'build') {
      // Create a build on the table
      if (!buildValue || buildValue < 2 || buildValue > 14) {
        return c.json({ error: 'Build value must be between 2 and 14' }, 400)
      }
      
      // Verify player has a card that can capture this build (excluding the card being played)
      const capturingCards = playerHand.filter(card => getCardValue(card.rank) === buildValue && card.id !== cardId)
      if (capturingCards.length === 0) {
        const availableValues = playerHand
          .filter(card => card.id !== cardId)
          .map(card => getCardValue(card.rank))
          .sort((a, b) => a - b)
        return c.json({ 
          error: `You cannot build ${buildValue} because you don't have a ${buildValue}-value card in hand to capture it. Available values: ${availableValues.join(', ')}` 
        }, 400)
      }
      
      let totalValue = playedCardValue
      const buildCards = [playedCard]
      
      for (const targetCardId of targetCards || []) {
        const tableCard = gameState.tableCards.find(card => card.id === targetCardId)
        if (tableCard) {
          totalValue += getCardValue(tableCard.rank)
          buildCards.push(tableCard)
          // Remove from table
          const index = gameState.tableCards.findIndex(c => c.id === tableCard.id)
          if (index !== -1) {
            gameState.tableCards.splice(index, 1)
          }
        }
      }
      
      if (totalValue !== buildValue) {
        return c.json({ 
          error: `Build total (${totalValue}) must match declared value (${buildValue}). Adjust your selection or build value.` 
        }, 400)
      }
      
      // Add build to table
      gameState.builds.push({
        id: `build-${Date.now()}`,
        cards: buildCards,
        value: buildValue,
        owner: playerId
      })
      
      gameState.lastPlay = {
        playerId,
        action: 'build',
        card: playedCard,
        buildValue,
        buildCards
      }
      
    } else {
      // Trail - just play the card to the table
      gameState.tableCards.push(playedCard)
      
      gameState.lastPlay = {
        playerId,
        action: 'trail',
        card: playedCard
      }
    }
    
    // Remove played card from hand
    playerHand.splice(cardIndex, 1)
    
    // Switch turns
    gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1
    
    // Check if hands are empty (need to deal more cards)
    const totalHandCards = gameState.player1Hand.length + gameState.player2Hand.length
    if (totalHandCards === 0) {
      if (gameState.deck.length > 0) {
        if (gameState.round === 1) {
          gameState.phase = 'dealingRound2'
          gameState.round = 2
          
          // Auto-deal remaining cards for round 2 after 2 seconds
          setTimeout(async () => {
            const currentGameState = await kv.get(`game:${roomId}`)
            if (currentGameState && currentGameState.phase === 'dealingRound2') {
              // Deal 4 cards to each player for round 2
              for (let i = 0; i < 8 && currentGameState.deck.length > 0; i++) {
                const card = currentGameState.deck.pop()
                if (i % 2 === 0) {
                  currentGameState.player1Hand.push(card)
                } else {
                  currentGameState.player2Hand.push(card)
                }
              }
              currentGameState.phase = 'round2'
              currentGameState.currentTurn = 1 // Player 1 starts round 2
              currentGameState.lastUpdate = new Date().toISOString()
              await kv.set(`game:${roomId}`, currentGameState)
            }
          }, 2000)
        } else {
          // Continue round 2, deal more cards
          for (let i = 0; i < 8 && gameState.deck.length > 0; i++) {
            const card = gameState.deck.pop()
            if (i % 2 === 0) {
              gameState.player1Hand.push(card)
            } else {
              gameState.player2Hand.push(card)
            }
          }
        }
      } else {
        // Game finished - last player captures remaining table cards
        const lastPlayer = playerId
        const remainingCards = [...gameState.tableCards]
        gameState.builds.forEach(build => remainingCards.push(...build.cards))
        
        if (lastPlayer === 1) {
          gameState.player1Captured.push(...remainingCards)
        } else {
          gameState.player2Captured.push(...remainingCards)
        }
        
        gameState.tableCards = []
        gameState.builds = []
        gameState.phase = 'finished'
        
        // Calculate final scores
        const scores = calculateScores(gameState)
        gameState.player1Score = scores.player1Score
        gameState.player2Score = scores.player2Score
        
        if (gameState.player1Score > gameState.player2Score) {
          gameState.winner = 1
        } else if (gameState.player2Score > gameState.player1Score) {
          gameState.winner = 2
        } else {
          gameState.winner = 'tie'
        }
      }
    }
    
    // Update live scores
    const currentScores = calculateScores(gameState)
    gameState.player1Score = currentScores.player1Score
    gameState.player2Score = currentScores.player2Score
    
    gameState.lastUpdate = new Date().toISOString()
    await kv.set(`game:${roomId}`, gameState)
    
    return c.json({ success: true, gameState })
  } catch (error) {
    console.log('Error playing card:', error)
    return c.json({ error: 'Failed to play card', details: error.message }, 500)
  }
})

// Get game state
app.get('/make-server-48645a41/game/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId')
    const gameState = await kv.get(`game:${roomId}`)
    
    if (!gameState) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    // Calculate countdown remaining if in countdown phase
    if (gameState.phase === 'countdown' && gameState.countdownStartTime) {
      const countdownStart = new Date(gameState.countdownStartTime)
      const now = new Date()
      const elapsed = (now.getTime() - countdownStart.getTime()) / 1000
      gameState.countdownRemaining = Math.max(0, 30 - elapsed)
      
      // Auto-advance to shuffling phase if countdown is complete
      if (gameState.countdownRemaining <= 0 && gameState.phase === 'countdown') {
        gameState.phase = 'readyToShuffle'
        gameState.lastUpdate = new Date().toISOString()
        await kv.set(`game:${roomId}`, gameState)
      }
    }
    
    return c.json({ success: true, gameState })
  } catch (error) {
    console.log('Error getting game state:', error)
    return c.json({ error: 'Failed to get game state', details: error.message }, 500)
  }
})

// Reset game
app.post('/make-server-48645a41/reset-game', async (c) => {
  try {
    const { roomId } = await c.req.json()
    
    const gameState = await kv.get(`game:${roomId}`)
    if (!gameState) {
      return c.json({ error: 'Game not found' }, 404)
    }
    
    // Reset game to initial state
    const deck = createDeck()
    gameState.deck = deck
    gameState.player1Hand = []
    gameState.player2Hand = []
    gameState.tableCards = []
    gameState.builds = []
    gameState.player1Captured = []
    gameState.player2Captured = []
    gameState.phase = 'countdown'
    gameState.round = 0
    gameState.countdownStartTime = new Date().toISOString()
    gameState.gameStarted = false
    gameState.shuffleComplete = false
    gameState.cardSelectionComplete = false
    gameState.dealingComplete = false
    gameState.currentTurn = 1
    gameState.player1Score = 0
    gameState.player2Score = 0
    gameState.winner = null
    gameState.lastPlay = null
    gameState.lastUpdate = new Date().toISOString()
    
    await kv.set(`game:${roomId}`, gameState)
    
    return c.json({ success: true, gameState })
  } catch (error) {
    console.log('Error resetting game:', error)
    return c.json({ error: 'Failed to reset game', details: error.message }, 500)
  }
})

Deno.serve(app.fetch)