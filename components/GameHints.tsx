import React from 'react'
import { Badge } from './ui/badge'
import { Lightbulb, Target, Plus, ArrowRight } from 'lucide-react'

interface GameCard {
  id: string
  suit: string
  rank: string
}

interface Build {
  id: string
  cards: GameCard[]
  value: number
  owner: number
}

interface PossibleMove {
  type: 'capture' | 'build' | 'trail'
  handCard: GameCard
  targetCards?: GameCard[]
  targetBuilds?: Build[]
  buildValue?: number
  score: number // How good this move is (0-100)
  description: string
}

interface GameHintsProps {
  playerHand: GameCard[]
  tableCards: GameCard[]
  builds: Build[]
  enabled: boolean
  playerId: number
}

function getCardValue(rank: string): number {
  if (rank === 'A') return 14
  if (rank === 'K') return 13
  if (rank === 'Q') return 12
  if (rank === 'J') return 11
  return parseInt(rank)
}

function isHighValueCard(card: GameCard): boolean {
  return (
    card.rank === 'A' ||
    (card.rank === '2' && card.suit === 'spades') ||
    (card.rank === '10' && card.suit === 'diamonds')
  )
}

function calculateAllPossibleMoves(
  playerHand: GameCard[],
  tableCards: GameCard[],
  builds: Build[],
  playerId: number
): PossibleMove[] {
  const moves: PossibleMove[] = []

  for (const handCard of playerHand) {
    const handValue = getCardValue(handCard.rank)

    // Check for direct captures
    for (const tableCard of tableCards) {
      if (getCardValue(tableCard.rank) === handValue) {
        const score = calculateCaptureScore([tableCard], [])
        moves.push({
          type: 'capture',
          handCard,
          targetCards: [tableCard],
          score,
          description: `Capture ${tableCard.rank}${getSuitSymbol(tableCard.suit)} with ${handCard.rank}${getSuitSymbol(handCard.suit)}`
        })
      }
    }

    // Check for build captures
    for (const build of builds) {
      if (build.value === handValue) {
        const score = calculateCaptureScore(build.cards, [])
        moves.push({
          type: 'capture',
          handCard,
          targetBuilds: [build],
          score: score + 20, // Bonus for capturing builds
          description: `Capture build (${build.value}) with ${handCard.rank}${getSuitSymbol(handCard.suit)}`
        })
      }
    }

    // Check for combination captures
    const combinations = findCardCombinations(tableCards, handValue)
    for (const combo of combinations) {
      if (combo.length > 1) {
        const score = calculateCaptureScore(combo, [])
        moves.push({
          type: 'capture',
          handCard,
          targetCards: combo,
          score: score + (combo.length * 5), // Bonus for multi-card captures
          description: `Capture ${combo.length} cards (${combo.map(c => c.rank).join('+')}) with ${handCard.rank}${getSuitSymbol(handCard.suit)}`
        })
      }
    }

    // Check for possible builds
    for (let buildValue = 2; buildValue <= 14; buildValue++) {
      if (buildValue === handValue) continue // Can't build same value as hand card
      
      // Check if player has a card to capture this build (STRICT ENFORCEMENT)
      const capturingCards = playerHand.filter(card => 
        getCardValue(card.rank) === buildValue && card.id !== handCard.id
      )
      
      if (capturingCards.length > 0) {
        const neededValue = buildValue - handValue
        if (neededValue > 0) {
          const buildCombos = findCardCombinations(tableCards, neededValue)
          for (const combo of buildCombos) {
            if (combo.length > 0) {
              const score = calculateBuildScore(combo, buildValue)
              moves.push({
                type: 'build',
                handCard,
                targetCards: combo,
                buildValue,
                score: score + 10, // Bonus for having capturing card
                description: `Build ${buildValue} using ${handCard.rank}${getSuitSymbol(handCard.suit)} + ${combo.map(c => c.rank).join('+')} (capture with ${capturingCards[0].rank}${getSuitSymbol(capturingCards[0].suit)})`
              })
            }
          }
        }
      }
    }

    // Trail option (always available but usually low score)
    moves.push({
      type: 'trail',
      handCard,
      score: isHighValueCard(handCard) ? 5 : 10, // Lower score for high-value cards
      description: `Trail ${handCard.rank}${getSuitSymbol(handCard.suit)} to table`
    })
  }

  return moves.sort((a, b) => b.score - a.score)
}

function findCardCombinations(cards: GameCard[], targetValue: number): GameCard[][] {
  const combinations: GameCard[][] = []

  // Single card matches
  for (const card of cards) {
    if (getCardValue(card.rank) === targetValue) {
      combinations.push([card])
    }
  }

  // Two card combinations
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const sum = getCardValue(cards[i].rank) + getCardValue(cards[j].rank)
      if (sum === targetValue) {
        combinations.push([cards[i], cards[j]])
      }
    }
  }

  // Three card combinations (limited for performance)
  if (cards.length <= 8) {
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          const sum = getCardValue(cards[i].rank) + getCardValue(cards[j].rank) + getCardValue(cards[k].rank)
          if (sum === targetValue) {
            combinations.push([cards[i], cards[j], cards[k]])
          }
        }
      }
    }
  }

  return combinations
}

function calculateCaptureScore(cards: GameCard[], builds: Build[]): number {
  let score = 0
  
  // Base score for number of cards
  score += cards.length * 10
  score += builds.reduce((sum, build) => sum + build.cards.length * 10, 0)
  
  // Bonus for high-value cards
  for (const card of cards) {
    if (isHighValueCard(card)) {
      if (card.rank === '10' && card.suit === 'diamonds') {
        score += 30 // 10 of diamonds is worth 2 points
      } else {
        score += 20 // Aces and 2 of spades
      }
    }
    if (card.suit === 'spades') {
      score += 5 // Spades help with spades majority
    }
  }
  
  return score
}

function calculateBuildScore(cards: GameCard[], buildValue: number): number {
  let score = 15 // Base score for creating a build
  
  // Bonus for using multiple cards
  score += cards.length * 5
  
  // Bonus for high-value builds
  if (buildValue >= 12) score += 10
  
  // Bonus if it uses high-value cards
  for (const card of cards) {
    if (isHighValueCard(card)) score += 15
    if (card.suit === 'spades') score += 3
  }
  
  return score
}

function getSuitSymbol(suit: string): string {
  switch (suit) {
    case 'hearts': return '♥'
    case 'diamonds': return '♦'
    case 'clubs': return '♣'
    case 'spades': return '♠'
    default: return ''
  }
}

export function GameHints({ playerHand, tableCards, builds, enabled, playerId }: GameHintsProps) {
  if (!enabled) return null

  const possibleMoves = calculateAllPossibleMoves(playerHand, tableCards, builds, playerId)
  const bestMoves = possibleMoves.slice(0, 3) // Show top 3 moves

  if (bestMoves.length === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-yellow-600" />
        <h3 className="font-medium text-yellow-800">Suggested Moves</h3>
      </div>
      
      <div className="space-y-2">
        {bestMoves.map((move, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              #{index + 1}
            </Badge>
            
            {move.type === 'capture' && (
              <Target className="h-3 w-3 text-green-600" />
            )}
            {move.type === 'build' && (
              <Plus className="h-3 w-3 text-blue-600" />
            )}
            {move.type === 'trail' && (
              <ArrowRight className="h-3 w-3 text-gray-600" />
            )}
            
            <span className={`${
              move.type === 'capture' ? 'text-green-700' :
              move.type === 'build' ? 'text-blue-700' :
              'text-gray-700'
            }`}>
              {move.description}
            </span>
            
            <Badge variant="secondary" className="ml-auto text-xs">
              {move.score}
            </Badge>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-yellow-600 mt-2">
        💡 Higher scores indicate better moves. Capture high-value cards when possible!
      </p>
    </div>
  )
}

// Export helper functions for use in GameActions
export { calculateAllPossibleMoves, isHighValueCard }