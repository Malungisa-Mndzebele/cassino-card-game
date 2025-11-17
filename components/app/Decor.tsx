import React from 'react'
import { Heart, Diamond, Spade, Club, Crown, Star } from 'lucide-react'

/**
 * Decor Component
 * 
 * Renders floating decorative card suit symbols and casino icons
 * in the background for visual ambiance. Uses CSS animations for
 * floating effects with staggered delays.
 * 
 * @component
 * @example
 * ```tsx
 * // Show decorations on landing page
 * <Decor visible={!isConnected} />
 * 
 * // Hide decorations during gameplay
 * <Decor visible={false} />
 * ```
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether decorations should be visible
 * @returns {JSX.Element | null} Rendered decorations or null if not visible
 */
export function Decor({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-20 left-10 transform rotate-12 floating">
        <Heart className="w-20 h-20 text-casino-red-light glow-casino" />
      </div>
      <div className="absolute top-40 right-20 transform -rotate-45 floating" style={{ animationDelay: '1s' }}>
        <Spade className="w-18 h-18 text-gray-300 glow-casino" />
      </div>
      <div className="absolute bottom-32 left-16 transform rotate-45 floating" style={{ animationDelay: '2s' }}>
        <Diamond className="w-22 h-22 text-casino-blue-light glow-casino" />
      </div>
      <div className="absolute bottom-20 right-10 transform -rotate-12 floating" style={{ animationDelay: '3s' }}>
        <Club className="w-20 h-20 text-gray-300 glow-casino" />
      </div>
      <div className="absolute top-1/2 left-1/4 transform -rotate-12 floating" style={{ animationDelay: '0.5s' }}>
        <Crown className="w-16 h-16 text-casino-gold glow-gold" />
      </div>
      <div className="absolute top-1/3 right-1/3 transform rotate-45 floating" style={{ animationDelay: '1.5s' }}>
        <Star className="w-14 h-14 text-casino-purple-light glow-casino" />
      </div>
    </div>
  )
}


