import React from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Crown, Star, Sparkles } from 'lucide-react'

interface CardProps {
  card?: {
    id: string
    suit: string
    rank: string
  }
  // Support individual props for backward compatibility
  id?: string
  suit?: string
  rank?: string
  onClick?: (card: { id: string; suit: string; rank: string }) => void
  disabled?: boolean
  selected?: boolean
  highlighted?: boolean
  size?: 'small' | 'medium' | 'normal' | 'large'
  showPoints?: boolean
  // Additional props used by other components
  isPlayable?: boolean
  isHidden?: boolean
}

export function Card({ 
  card, 
  id: cardId,
  suit: cardSuit,
  rank: cardRank,
  onClick, 
  disabled = false, 
  selected = false, 
  highlighted = false, 
  size = 'normal',
  showPoints = true,
  isPlayable = true,
  isHidden = false
}: CardProps) {
  // Create card object from individual props if card prop is not provided
  const cardData = card || { id: cardId || '', suit: cardSuit || '', rank: cardRank || '' };
  
  // Handle missing or invalid card data - add more robust validation
  if (!cardData || typeof cardData !== 'object' || !cardData.suit || !cardData.rank || 
      typeof cardData.suit !== 'string' || typeof cardData.rank !== 'string') {
    return (
      <div className={`
        ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-20 h-28' : 'w-16 h-24'}
        bg-gradient-to-br from-gray-50 to-gray-100 
        border-2 border-dashed border-gray-300 
        rounded-xl flex items-center justify-center
        transition-all duration-300 hover:border-gray-400
        shadow-inner
      `}>
        <div className="text-gray-400 text-xs font-medium">Empty</div>
      </div>
    )
  }

  // Handle hidden cards (for opponent's hand)
  if (isHidden) {
    return (
      <div className={`
        ${size === 'small' ? 'w-12 h-16' : size === 'large' ? 'w-20 h-28' : 'w-16 h-24'}
        bg-gradient-to-br from-blue-600 to-blue-800
        border-2 border-blue-400
        rounded-xl flex items-center justify-center
        shadow-lg
      `}>
        <div className="text-white text-xs font-bold">?</div>
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
    return suit === 'hearts' || suit === 'diamonds' 
      ? 'text-casino-red' 
      : 'text-gray-800'
  }

  const getSuitGradient = (suit: string) => {
    switch (suit) {
      case 'hearts': 
        return 'from-casino-red-light to-casino-red-dark'
      case 'diamonds': 
        return 'from-casino-blue-light to-casino-blue-dark'
      case 'clubs': 
        return 'from-gray-700 to-gray-900'
      case 'spades': 
        return 'from-gray-800 to-black'
      default: 
        return 'from-gray-600 to-gray-800'
    }
  }

  // getCardValue unused – remove to avoid lint warning

  const isSpecialCard = (cardSuit: string, cardRank: string) => {
    return (
      cardRank === 'A' || // All Aces
      (cardSuit === 'spades' && cardRank === '2') || // 2 of Spades
      (cardSuit === 'diamonds' && cardRank === '10') // 10 of Diamonds
    )
  }

  const getCardPoints = (cardSuit: string, cardRank: string) => {
    if (cardRank === 'A') return 1
    if (cardSuit === 'spades' && cardRank === '2') return 1
    if (cardSuit === 'diamonds' && cardRank === '10') return 2
    return 0
  }

  const { suit: cardSuitValue, rank: cardRankValue } = cardData
  // Ensure suit and rank are strings
  const safeSuit = String(cardSuitValue || '')
  const safeRank = String(cardRankValue || '')
  const suitSymbol = getSuitSymbol(safeSuit)
  const suitColor = getSuitColor(safeSuit)
  const suitGradient = getSuitGradient(safeSuit)
  const points = getCardPoints(safeSuit, safeRank)
  const special = isSpecialCard(safeSuit, safeRank)

  const sizeClasses = {
    small: 'w-12 h-16 text-xs',
    medium: 'w-14 h-20 text-sm',
    normal: 'w-16 h-24 text-sm',
    large: 'w-20 h-28 text-base'
  }

  const cardContent = (
    <div className={`
      ${sizeClasses[size]}
      relative bg-gradient-to-br from-white via-gray-50 to-white
      rounded-xl shadow-lg border-2 
      transition-all duration-300 ease-out
      card-hover
      ${selected 
        ? 'border-casino-gold ring-4 ring-casino-gold/30 shadow-glow-gold transform -translate-y-2 shadow-2xl' 
        : highlighted 
        ? 'border-casino-blue ring-3 ring-casino-blue/30 shadow-casino' 
        : special
        ? 'border-casino-purple/40 shadow-casino hover:border-casino-purple'
        : 'border-gray-200 hover:border-gray-300 hover:shadow-casino'
      }
      ${disabled || !isPlayable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${onClick && isPlayable ? 'hover:scale-105 active:scale-95' : ''}
      overflow-hidden
    `}>
      {/* Background pattern for special cards */}
      {special && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1 right-1">
            <Sparkles className="w-3 h-3" />
          </div>
          <div className="absolute bottom-1 left-1">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 shimmer opacity-0 hover:opacity-100 transition-opacity duration-300" />
      
      {/* Main card content */}
      <div className="relative h-full flex flex-col justify-between p-2">
        {/* Top corner - rank and suit */}
        <div className={`flex flex-col items-center ${suitColor} font-bold leading-none`}>
          <div className={`${size === 'small' ? 'text-xs' : 'text-sm'} font-black`}>
            {safeRank}
          </div>
          <div className={`${size === 'small' ? 'text-xs' : 'text-base'} leading-none mt-0.5 
            bg-gradient-to-br ${suitGradient} bg-clip-text text-transparent font-black`}>
            {suitSymbol}
          </div>
        </div>

        {/* Center suit symbol (for face cards and aces) */}
        {(safeRank === 'A' || safeRank === 'K' || safeRank === 'Q' || safeRank === 'J') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`
              ${size === 'small' ? 'text-xl' : size === 'large' ? 'text-4xl' : 'text-2xl'} 
              font-black opacity-20
              bg-gradient-to-br ${suitGradient} bg-clip-text text-transparent
            `}>
              {safeRank === 'A' ? suitSymbol : safeRank}
            </div>
          </div>
        )}

        {/* Bottom corner - rank and suit (rotated) */}
        <div className={`flex flex-col items-center ${suitColor} font-bold leading-none self-end transform rotate-180`}>
          <div className={`${size === 'small' ? 'text-xs' : 'text-sm'} font-black`}>
            {safeRank}
          </div>
          <div className={`${size === 'small' ? 'text-xs' : 'text-base'} leading-none mt-0.5 
            bg-gradient-to-br ${suitGradient} bg-clip-text text-transparent font-black`}>
            {suitSymbol}
          </div>
        </div>
      </div>

      {/* Points badge for special cards */}
      {showPoints && points > 0 && (
        <div className="absolute -top-2 -right-2">
          <Badge className={`
            ${size === 'small' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}
            bg-gradient-to-r from-casino-gold to-casino-gold-dark 
            text-white font-bold shadow-gold border-0
            animate-pulse-slow
          `}>
            {points === 2 ? (
              <div className="flex items-center space-x-0.5">
                <Crown className="w-2.5 h-2.5" />
                <span>{points}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-0.5">
                <Star className="w-2.5 h-2.5" />
                <span>{points}</span>
              </div>
            )}
          </Badge>
        </div>
      )}

      {/* Special card glow effect */}
      {special && selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-casino-gold/20 via-transparent to-casino-purple/20 rounded-xl pointer-events-none" />
      )}
    </div>
  )

  if (onClick && !disabled && isPlayable) {
    const ariaLabel = `${safeRank} of ${safeSuit}${points > 0 ? ` (${points} point${points > 1 ? 's' : ''})` : ''}`;
    return (
      <Button
        variant="ghost"
        className="p-0 h-auto w-auto bg-transparent hover:bg-transparent border-0 shadow-none"
        onClick={() => onClick(cardData)}
        aria-label={ariaLabel}
        aria-pressed={selected}
        tabIndex={0}
      >
        {cardContent}
      </Button>
    )
  }

  return cardContent
}
