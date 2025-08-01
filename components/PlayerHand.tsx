import React from 'react'
import { Card } from './Card'

interface GameCard {
  id: string
  suit: string
  rank: string
}

interface PlayerHandProps {
  cards: GameCard[]
  isOpponent: boolean
  playerName: string
  onPlayCard?: (cardId: string) => void
  canPlay?: boolean
}

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