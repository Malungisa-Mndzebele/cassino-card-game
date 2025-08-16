import React from 'react'
import { Card } from './Card'
import { Button } from './ui/button'

interface GameCard {
  id: string
  suit: string
  rank: string
}

interface PlayedCard extends GameCard {
  playedBy: number
}

interface GameBoardProps {
  playedCards: PlayedCard[]
  deckCount: number
  onDrawCard: () => void
  canDraw: boolean
}

export function GameBoard({ playedCards, deckCount, onDrawCard, canDraw }: GameBoardProps) {
  const lastPlayedCard = playedCards[playedCards.length - 1]

  return (
    <div className="bg-green-700 rounded-lg p-6 mb-6 shadow-lg">
      <div className="flex justify-between items-center">
        {/* Deck */}
        <div className="text-center">
          <div className="mb-2">
            <div className="w-20 h-28 bg-blue-800 border-2 border-blue-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                 onClick={canDraw ? onDrawCard : undefined}>
              <div className="text-white text-2xl">🂠</div>
            </div>
          </div>
          <div className="text-white text-sm font-medium">
            Deck ({deckCount})
          </div>
          {canDraw && (
            <Button 
              onClick={onDrawCard}
              size="sm"
              className="mt-2"
            >
              Draw Card
            </Button>
          )}
        </div>

        {/* Played Cards Area */}
        <div className="flex-1 mx-8">
          <h3 className="text-white text-center mb-4 font-semibold">Played Cards</h3>
          <div className="min-h-32 bg-green-600 rounded-lg border-2 border-dashed border-green-500 flex items-center justify-center">
            {lastPlayedCard ? (
              <div className="text-center">
                <Card
                  card={lastPlayedCard}
                  size="large"
                />
                <p className="text-white text-sm mt-2">
                  Played by Player {lastPlayedCard.playedBy}
                </p>
              </div>
            ) : (
              <p className="text-green-300 text-center">
                No cards played yet
              </p>
            )}
          </div>
          
          {playedCards.length > 1 && (
            <div className="mt-2 text-center">
              <p className="text-white text-sm">
                {playedCards.length} cards played total
              </p>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="text-center text-white">
          <div className="bg-green-600 rounded-lg p-3">
            <p className="text-sm font-medium">Game Status</p>
            <p className="text-xs mt-1 opacity-90">
              Cards in play: {playedCards.length}
            </p>
            <p className="text-xs opacity-90">
              Deck remaining: {deckCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}