import React, { useState, useEffect } from 'react'
import { Card } from './Card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { GameHints } from './GameHints'
import { soundManager } from './SoundSystem'

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

interface GameActionsProps {
  playerHand: GameCard[]
  tableCards: GameCard[]
  builds: Build[]
  onPlayCard: (cardId: string, action: string, targetCards?: string[], buildValue?: number) => void
  isMyTurn: boolean
  hintsEnabled?: boolean
  soundEnabled?: boolean
  playerId: number
}

function getCardValue(rank: string): number {
  if (rank === 'A') return 14
  if (rank === 'K') return 13
  if (rank === 'Q') return 12
  if (rank === 'J') return 11
  return parseInt(rank)
}

export function GameActions({ 
  playerHand, 
  tableCards, 
  builds, 
  onPlayCard, 
  isMyTurn,
  hintsEnabled = false,
  soundEnabled = true,
  playerId
}: GameActionsProps) {
  const [selectedHandCard, setSelectedHandCard] = useState<string>('')
  const [selectedTableCards, setSelectedTableCards] = useState<string[]>([])
  const [selectedBuilds, setSelectedBuilds] = useState<string[]>([])
  const [action, setAction] = useState<'capture' | 'build' | 'trail'>('trail')
  const [buildValue, setBuildValue] = useState<number>(0)
  const [highlightedCards, setHighlightedCards] = useState<string[]>([])

  const selectedCard = playerHand.find(card => card.id === selectedHandCard)
  const selectedCardValue = selectedCard ? getCardValue(selectedCard.rank) : 0

  // Update highlights when hand card selection changes
  useEffect(() => {
    if (!hintsEnabled || !selectedCard) {
      setHighlightedCards([])
      return
    }

    const highlights: string[] = []
    const handValue = getCardValue(selectedCard.rank)

    // Highlight direct capture opportunities
    for (const tableCard of tableCards) {
      if (getCardValue(tableCard.rank) === handValue) {
        highlights.push(tableCard.id)
      }
    }

    // Highlight builds that can be captured
    for (const build of builds) {
      if (build.value === handValue) {
        highlights.push(build.id)
      }
    }

    setHighlightedCards(highlights)
  }, [selectedCard, tableCards, builds, hintsEnabled])

  const calculateSelectedValue = () => {
    let total = 0
    
    // Add values from selected table cards
    for (const cardId of selectedTableCards) {
      const card = tableCards.find(c => c.id === cardId)
      if (card) {
        total += getCardValue(card.rank)
      }
    }
    
    // Add values from selected builds
    for (const buildId of selectedBuilds) {
      const build = builds.find(b => b.id === buildId)
      if (build) {
        total += build.value
      }
    }
    
    return total
  }

  const canCapture = () => {
    if (!selectedCard) return false
    const total = calculateSelectedValue()
    return total === selectedCardValue && (selectedTableCards.length > 0 || selectedBuilds.length > 0)
  }

  const getCapturingCards = () => {
    if (!buildValue) return []
    return playerHand.filter(card => 
      getCardValue(card.rank) === buildValue && card.id !== selectedHandCard
    )
  }

  const canBuild = () => {
    if (!selectedCard || buildValue < 2 || buildValue > 14) return false
    const total = selectedCardValue + calculateSelectedValue()
    const capturingCards = getCapturingCards()
    return total === buildValue && capturingCards.length > 0 && selectedTableCards.length > 0
  }

  const handleTableCardClick = (cardId: string) => {
    if (selectedTableCards.includes(cardId)) {
      setSelectedTableCards(selectedTableCards.filter(id => id !== cardId))
    } else {
      setSelectedTableCards([...selectedTableCards, cardId])
    }
  }

  const handleBuildClick = (buildId: string) => {
    if (selectedBuilds.includes(buildId)) {
      setSelectedBuilds(selectedBuilds.filter(id => id !== buildId))
    } else {
      setSelectedBuilds([...selectedBuilds, buildId])
    }
  }

  const handlePlay = async () => {
    if (!selectedCard) return

    try {
      if (action === 'capture' && canCapture()) {
        const targetCards = [...selectedTableCards]
        // Add cards from builds to targets
        for (const buildId of selectedBuilds) {
          const build = builds.find(b => b.id === buildId)
          if (build) {
            targetCards.push(...build.cards.map(c => c.id))
          }
        }
        
        if (soundEnabled) {
          await soundManager.playSound('capture')
        }
        
        onPlayCard(selectedHandCard, 'capture', targetCards)
      } else if (action === 'build' && canBuild()) {
        if (soundEnabled) {
          await soundManager.playSound('build')
        }
        
        onPlayCard(selectedHandCard, 'build', selectedTableCards, buildValue)
      } else {
        if (soundEnabled) {
          await soundManager.playSound('trail')
        }
        
        onPlayCard(selectedHandCard, 'trail')
      }

      // Reset selections
      setSelectedHandCard('')
      setSelectedTableCards([])
      setSelectedBuilds([])
      setBuildValue(0)
      setAction('trail')
    } catch (error) {
      console.error('Error playing card:', error)
      if (soundEnabled) {
        await soundManager.playSound('error')
      }
    }
  }

  if (!isMyTurn) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <div className="text-center text-gray-500">
          <p>Waiting for opponent's turn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hints */}
      {hintsEnabled && (
        <GameHints
          playerHand={playerHand}
          tableCards={tableCards}
          builds={builds}
          enabled={hintsEnabled}
          playerId={playerId}
        />
      )}

      {/* Player Hand */}
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h3 className="font-medium mb-3">Your Hand - Select a card to play</h3>
        <div className="flex gap-2 justify-center">
          {playerHand.map((card) => {
            const isSelected = selectedHandCard === card.id
            const isCapturingCard = action === 'build' && buildValue > 0 && 
              getCardValue(card.rank) === buildValue && card.id !== selectedHandCard
            
            return (
              <div
                key={card.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'transform -translate-y-2 ring-2 ring-blue-500' : ''
                } ${
                  isCapturingCard ? 'ring-2 ring-green-400 animate-pulse' : ''
                }`}
                onClick={() => setSelectedHandCard(card.id)}
              >
                <Card
                  suit={card.suit}
                  rank={card.rank}
                  id={card.id}
                  isPlayable={true}
                  size="medium"
                />
                {isCapturingCard && (
                  <p className="text-xs text-center mt-1 text-green-600 font-medium">
                    Can capture build
                  </p>
                )}
              </div>
            )
          })}
        </div>
        {selectedCard && (
          <div className="mt-2 text-center">
            <Badge variant="default">
              Selected: {selectedCard.rank} of {selectedCard.suit} (Value: {selectedCardValue})
            </Badge>
          </div>
        )}
      </div>

      {/* Action Selection */}
      {selectedCard && (
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <h3 className="font-medium mb-3">Choose Action</h3>
          <div className="flex gap-2 mb-4">
            <Button
              variant={action === 'trail' ? 'default' : 'outline'}
              onClick={() => setAction('trail')}
              size="sm"
            >
              Trail (Play to table)
            </Button>
            <Button
              variant={action === 'capture' ? 'default' : 'outline'}
              onClick={() => setAction('capture')}
              size="sm"
              disabled={!canCapture() && selectedTableCards.length === 0 && selectedBuilds.length === 0}
            >
              Capture {canCapture() && '✓'}
            </Button>
            <Button
              variant={action === 'build' ? 'default' : 'outline'}
              onClick={() => setAction('build')}
              size="sm"
            >
              Build
            </Button>
          </div>

          {action === 'build' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Build Value (2-14):</label>
              <Input
                type="number"
                min="2"
                max="14"
                value={buildValue || ''}
                onChange={(e) => setBuildValue(parseInt(e.target.value) || 0)}
                className="w-20"
              />
              <p className="text-xs text-gray-600 mt-1">
                Current total: {selectedCardValue + calculateSelectedValue()}
                {buildValue > 0 && (
                  <span className={buildValue === selectedCardValue + calculateSelectedValue() ? 'text-green-600' : 'text-red-600'}>
                    {' '}({buildValue === selectedCardValue + calculateSelectedValue() ? 'Perfect!' : 'Needs adjustment'})
                  </span>
                )}
              </p>
              
              {buildValue > 0 && (
                <div className="mt-2">
                  {getCapturingCards().length > 0 ? (
                    <div className="text-xs text-green-600">
                      ✓ You can capture this build with: {getCapturingCards().map(c => c.rank).join(', ')}
                    </div>
                  ) : (
                    <div className="text-xs text-red-600">
                      ✗ You need a {buildValue}-value card in hand to capture this build
                      <br />
                      Available values: {playerHand
                        .filter(c => c.id !== selectedHandCard)
                        .map(c => getCardValue(c.rank))
                        .sort((a, b) => a - b)
                        .join(', ')}
                    </div>
                  )}
                </div>
              )}
              
              {!canBuild() && buildValue > 0 && buildValue === selectedCardValue + calculateSelectedValue() && getCapturingCards().length === 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  <strong>Rule Reminder:</strong> You can only build values that you have cards to capture with in your hand.
                </div>
              )}
            </div>
          )}

          {(action === 'capture' || action === 'build') && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {action === 'capture' 
                  ? `Select cards that sum to ${selectedCardValue}:` 
                  : `Select cards to build with (need total ${buildValue}):`
                }
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Currently selected value: {calculateSelectedValue()}
                {action === 'capture' && calculateSelectedValue() > 0 && (
                  <span className={calculateSelectedValue() === selectedCardValue ? 'text-green-600' : 'text-orange-600'}>
                    {' '}({calculateSelectedValue() === selectedCardValue ? 'Perfect match!' : 'Keep adjusting'})
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={handlePlay}
              disabled={
                action === 'capture' ? !canCapture() :
                action === 'build' ? !canBuild() :
                false
              }
              size="lg"
              className={
                action === 'capture' && canCapture() ? 'bg-green-600 hover:bg-green-700' :
                action === 'build' && canBuild() ? 'bg-blue-600 hover:bg-blue-700' :
                ''
              }
            >
              {action === 'trail' ? 'Trail Card' :
               action === 'capture' ? (canCapture() ? 'Capture Cards ✓' : 'Cannot Capture') :
               (canBuild() ? 'Create Build ✓' : 
                buildValue > 0 && getCapturingCards().length === 0 ? 'Need Capturing Card' : 
                'Create Build')}
            </Button>
          </div>
          
          {/* Additional restriction reminder */}
          {action === 'build' && !canBuild() && buildValue > 0 && selectedTableCards.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="text-yellow-600 mt-1">⚠️</div>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Build Rule Violation</p>
                  <p className="text-yellow-700 mt-1">
                    You can only create builds that you have cards to capture with. 
                    {getCapturingCards().length === 0 && (
                      <span> You need a {buildValue}-value card in your hand to build {buildValue}.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table Cards */}
      <div className="bg-white rounded-lg p-4 shadow-lg">
        <h3 className="font-medium mb-3">Table Cards</h3>
        {tableCards.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {tableCards.map((card) => (
              <div
                key={card.id}
                className={`cursor-pointer transition-all ${
                  selectedTableCards.includes(card.id) ? 'ring-2 ring-blue-500 transform scale-105' : ''
                } ${
                  hintsEnabled && highlightedCards.includes(card.id) ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                }`}
                onClick={() => (action === 'capture' || action === 'build') && handleTableCardClick(card.id)}
              >
                <Card
                  suit={card.suit}
                  rank={card.rank}
                  id={card.id}
                  size="small"
                />
                <p className="text-xs text-center mt-1">Val: {getCardValue(card.rank)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No cards on table</p>
        )}
      </div>

      {/* Builds */}
      {builds.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-lg">
          <h3 className="font-medium mb-3">Current Builds</h3>
          <div className="space-y-2">
            {builds.map((build) => (
              <div
                key={build.id}
                className={`p-2 border rounded-lg cursor-pointer transition-all ${
                  selectedBuilds.includes(build.id) ? 'ring-2 ring-blue-500 transform scale-102' : ''
                } ${
                  hintsEnabled && highlightedCards.includes(build.id) ? 'ring-2 ring-yellow-400 animate-pulse' : ''
                }`}
                onClick={() => action === 'capture' && handleBuildClick(build.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">Build Value: {build.value}</Badge>
                  <Badge variant={build.owner === playerId ? "default" : "outline"}>
                    Player {build.owner} {build.owner === playerId && '(You)'}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  {build.cards.map((card) => (
                    <Card
                      key={card.id}
                      suit={card.suit}
                      rank={card.rank}
                      id={card.id}
                      size="small"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}