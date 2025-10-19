import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Trophy, Users, Clock, Wifi, WifiOff, Star, Crown } from 'lucide-react'

interface AppHeaderProps {
  roomId: string
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  myName: string
  opponentName: string
  myScore: number
  opponentScore: number
  phase?: string
  round?: number
  onLeave: () => void
}

export function AppHeader({
  roomId,
  connectionStatus,
  myName,
  opponentName,
  myScore,
  opponentScore,
  phase,
  round,
  onLeave,
}: AppHeaderProps) {
  return (
    <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-lg opacity-50 animate-pulse-slow"></div>
              <div className="relative backdrop-casino-dark rounded-full p-4 shadow-gold">
                <Crown className="w-10 h-10 text-casino-gold glow-gold" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black text-gradient-casino mb-2">Cassino</h1>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center backdrop-casino-dark px-3 py-1.5 rounded-full shadow-casino">
                  <Users className="w-4 h-4 mr-2 text-casino-blue" />
                  <span className="font-medium text-white">{roomId}</span>
                </span>
                <Separator orientation="vertical" className="h-4 bg-casino-gold/30" />
                <span className="flex items-center backdrop-casino-dark px-3 py-1.5 rounded-full shadow-casino">
                  {connectionStatus === 'connected' ? (
                    <Wifi className="w-4 h-4 mr-2 text-casino-green-light" />
                  ) : connectionStatus === 'connecting' ? (
                    <Clock className="w-4 h-4 mr-2 text-casino-gold animate-spin" />
                  ) : (
                    <WifiOff className="w-4 h-4 mr-2 text-casino-red-light" />
                  )}
                  <span className="font-medium text-white">
                    {connectionStatus === 'connected'
                      ? 'Connected'
                      : connectionStatus === 'connecting'
                      ? 'Connecting...'
                      : 'Disconnected'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="text-center backdrop-casino-dark rounded-xl px-6 py-4 shadow-casino border border-casino-gold/20">
              <div className="text-sm font-medium text-casino-gold mb-2 uppercase tracking-wider">{myName}</div>
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5 text-casino-gold" />
                <span className="text-2xl font-black text-gradient-gold">{myScore}</span>
                <span className="text-lg font-medium text-white/60">/11</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-black text-white/30 shimmer">VS</div>
            </div>

            <div className="text-center backdrop-casino-dark rounded-xl px-6 py-4 shadow-casino border border-casino-blue/20">
              <div className="text-sm font-medium text-casino-blue mb-2 uppercase tracking-wider">{opponentName}</div>
              <div className="flex items-center justify-center space-x-2">
                <Trophy className="w-5 h-5 text-casino-blue" />
                <span className="text-2xl font-black text-gradient-casino">{opponentScore}</span>
                <span className="text-lg font-medium text-white/60">/11</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right backdrop-casino-dark rounded-xl px-4 py-3 shadow-casino border border-casino-purple/20" aria-live="polite">
              <div className="flex items-center space-x-2 mb-1">
                <Star className="w-4 h-4 text-casino-purple glow-casino" />
                <span className="text-sm font-medium text-white">
                  {phase ? phase.charAt(0).toUpperCase() + phase.slice(1) : 'Waiting'}
                </span>
              </div>
              {(round || 0) > 0 && (
                <div className="text-xs text-casino-purple-light font-medium">Round {round || 0}/2</div>
              )}
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="flex items-center space-x-2">
              <Button
                onClick={onLeave}
                variant="outline"
                size="sm"
                className="border-casino-red/50 text-casino-red hover:bg-casino-red/10 hover:border-casino-red backdrop-casino-dark shadow-casino transition-all duration-300"
              >
                Leave Game
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


