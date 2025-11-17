import React from 'react'
import { Card } from './Card'

/**
 * Represents a playing card
 * @interface GameCard
 */
interface GameCard {
  /** Unique card identifier */
  id: string
  /** Card suit */
  suit: string
  /** Card rank */
  rank: string
}

/**
 * Props for the PlayerHand component
 * @interface PlayerHandProps
 */
interface PlayerHandProps {
  /** Array of cards in the player's hand */
  cards: GameCard[]
  /** Whether this is the opponent's hand (shows card backs) */
  isOpponent: boolean
  /** Name of the player */
  playerName: string
  /** Optional callback when a card is clicked */
  onPlayCard?: (cardId: string) => void
  /** Whether the player can currently play cards */
  canPlay?: boolean
}

/**
 * PlayerHand Component
 * 
 * Displays a player's hand of cards with appropriate styling and interaction.
 * Shows card backs for opponent's hand and face-up cards for current player.
 * 
 * @component
 * @example
 * ```tsx
 * // Current player's hand
 * <PlayerHand
 *   cards={myCards}
 *   isOpponent={false}
 *   playerName="Alice"
 *   onPlayCard={(cardId) => playCard(cardId)}
 *   canPlay={true}
 * />
 * 
 * // Opponent's hand (hidden cards)
 * <PlayerHand
 *   cards={opponentCards}
 *   isOpponent={true}
 *   playerName="Bob"
 *   canPlay={false}
 * />
 * ```
 * 
 * @param {PlayerHandProps} props - Component props
 * @returns {JSX.Element} Rendered player hand
 */
export function PlayerHand({ 
  cards, 
  isOpponent, 
  playerName, 
  onPlayCard, 
  canPlay = false 
}: PlayerHandProps) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">{playerName}</h3>
        <span className="text-sm text-gray-600">{cards.length} cards</span>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={`
              ${isOpponent ? '' : 'hover:z-10'} 
              ${!isOpponent && index > 0 ? '-ml-4' : ''}
            `}
            style={{ zIndex: cards.length - index }}
          >
            <Card
              suit={card.suit}
              rank={card.rank}
              id={card.id}
              isHidden={isOpponent}
              onClick={
                !isOpponent && onPlayCard && canPlay 
                  ? () => onPlayCard(card.id) 
                  : undefined
              }
              isPlayable={!isOpponent && canPlay}
              size={isOpponent ? 'small' : 'medium'}
            />
          </div>
        ))}
      </div>
      
      {!isOpponent && canPlay && (
        <div className="mt-2 text-center text-sm text-green-600 font-medium">
          Click a card to play it
        </div>
      )}
      
      {!isOpponent && !canPlay && (
        <div className="mt-2 text-center text-sm text-gray-500">
          Wait for your turn
        </div>
      )}
    </div>
  )
}