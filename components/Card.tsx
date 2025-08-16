import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Crown, Star } from 'lucide-react'

interface CardProps {
  card: {
    id: string
    suit: string
    rank: string
  }
  onClick?: (card: any) => void
  disabled?: boolean
  selected?: boolean
  highlighted?: boolean
  size?: 'small' | 'normal' | 'large'
  showPoints?: boolean
  isPlayable?: boolean
  isHidden?: boolean
}

export function Card({ 
  card, 
  onClick, 
  disabled = false, 
  selected = false, 
  highlighted = false, 
  size = 'normal',
  showPoints = true
}: CardProps) {
  if (!card) {
    return (
      <div className={`
        ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-20 h-28' : 'w-16 h-24'}
        bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center
      `}>
        <div className="text-gray-400 text-xs">Empty</div>
      </div>
    )
  }

  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts': return '♥'
      case 'diamonds': return '♦'
      case 'clubs': return '♣'
      case 'spades': return '♠'
      default: return suit
    }
  }

  const getSuitColor = (suit: string) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800'
  }

  const getCardValue = (rank: string) => {
    switch (rank) {
      case 'A': return 1
      case 'J': return 11
      case 'Q': return 12
      case 'K': return 13
      default: return parseInt(rank) || 0
    }
  }

  const isSpecialCard = () => {
    return (
      rank === 'A' || // All Aces
      (suit === 'spades' && rank === '2') || // 2 of Spades
      (suit === 'diamonds' && rank === '10') // 10 of Diamonds
    )
  }

  const getCardPoints = () => {
    if (rank === 'A') return 1
    if (suit === 'spades' && rank === '2') return 1
    if (suit === 'diamonds' && rank === '10') return 2
    return 0
  }

  const { suit, rank } = card
  const suitSymbol = getSuitSymbol(suit)
  const suitColor = getSuitColor(suit)
  const points = getCardPoints()
  const special = isSpecialCard()

  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    normal: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  }

  const cardContent = (
    <div className={`
      ${sizeClasses[size]}
      relative bg-white rounded-lg shadow-lg border-2 transition-all duration-200
      ${selected 
        ? 'border-emerald-500 ring-4 ring-emerald-200 shadow-emerald-200/50 transform -translate-y-2 shadow-2xl' 
        : highlighted 
        ? 'border-yellow-400 ring-2 ring-yellow-200 shadow-yellow-200/50' 
        : 'border-gray-200 hover:border-gray-300'
      }
      ${disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:shadow-xl hover:-translate-y-1 cursor-pointer'
      }
      ${special ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-white'}
    `}>
      {/* Special card indicator */}
      {special && showPoints && (
        <div className="absolute -top-1 -right-1 z-10">
          <Badge 
            variant="secondary" 
            className="h-5 px-1.5 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg"
          >
            {points === 2 ? (
              <Crown className="w-3 h-3" />
            ) : (
              <Star className="w-3 h-3" />
            )}
          </Badge>
        </div>
      )}

      {/* Card content */}
      <div className="flex flex-col justify-between h-full p-1.5">
        {/* Top rank and suit */}
        <div className="flex flex-col items-start">
          <div className={`font-bold ${suitColor} leading-none`}>
            {rank}
          </div>
          <div className={`${suitColor} leading-none ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {suitSymbol}
          </div>
        </div>

        {/* Center suit symbol (for larger cards) */}
        {size !== 'small' && (
          <div className={`text-center ${suitColor} ${size === 'large' ? 'text-2xl' : 'text-lg'} opacity-20`}>
            {suitSymbol}
          </div>
        )}

        {/* Bottom rank and suit (rotated) */}
        <div className="flex flex-col items-end transform rotate-180">
          <div className={`font-bold ${suitColor} leading-none`}>
            {rank}
          </div>
          <div className={`${suitColor} leading-none ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {suitSymbol}
          </div>
        </div>
      </div>

      {/* Points indicator for special cards */}
      {special && showPoints && points > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/10 to-transparent rounded-b-lg">
          <div className="text-center text-xs font-bold text-gray-600 py-0.5">
            {points}pt{points > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Selection overlay */}
      {selected && (
        <div className="absolute inset-0 bg-emerald-500/10 rounded-lg pointer-events-none"></div>
      )}

      {/* Highlight overlay */}
      {highlighted && !selected && (
        <div className="absolute inset-0 bg-yellow-400/10 rounded-lg pointer-events-none"></div>
      )}
    </div>
  )

  if (onClick && !disabled) {
    return (
      <Button
        variant="ghost"
        className="p-0 h-auto border-0 bg-transparent hover:bg-transparent"
        onClick={() => onClick(card)}
        aria-label={`${rank} of ${suit}${special ? ` (${points} point${points > 1 ? 's' : ''})` : ''}`}
        aria-pressed={selected}
        disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        {cardContent}
      </Button>
    )
  }

  return cardContent
}