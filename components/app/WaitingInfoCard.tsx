import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Clock, Trophy, Star, Crown } from 'lucide-react'

interface WaitingInfoCardProps {
  roomId: string
  players: Array<{ id: number; name: string }>
  statisticsEnabled: boolean
  statistics?: { gamesPlayed: number; gamesWon: number; bestScore: number }
}

export function WaitingInfoCard({ roomId, players, statisticsEnabled, statistics }: WaitingInfoCardProps) {
  const playerCount = players?.length || 0
  const winRate = statistics && statistics.gamesPlayed > 0
    ? ((statistics.gamesWon / statistics.gamesPlayed) * 100).toFixed(1)
    : '0.0'

  return (
    <Card className="backdrop-casino border-0 shadow-casino-lg overflow-hidden">
      <CardContent className="p-10">
        <div className="text-center">
          <div className="mb-8">
            <div className="inline-flex items-center space-x-3 backdrop-casino-dark rounded-2xl px-8 py-4 shadow-glow-casino border border-casino-blue/30">
              <Clock className="w-6 h-6 text-casino-blue animate-pulse" />
              <span className="text-white font-medium text-lg">Waiting for players...</span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-2xl text-white font-bold mb-6">{playerCount}/2 players joined</p>
            <div className="flex justify-center space-x-4">
              {players?.map(player => (
                <div key={player.id} className="backdrop-casino-dark rounded-xl px-6 py-3 border border-casino-green/30 shadow-casino">
                  <span className="text-casino-green-light font-medium text-lg">{player.name}</span>
                </div>
              ))}
              {playerCount < 2 && (
                <div className="backdrop-casino-dark rounded-xl px-6 py-3 border-2 border-dashed border-casino-gold/30 animate-pulse">
                  <span className="text-casino-gold">Waiting...</span>
                </div>
              )}
            </div>
          </div>

          <div className="backdrop-casino-dark rounded-2xl p-6 mb-8 border border-casino-gold/30 shadow-glow-gold">
            <p className="text-casino-gold font-medium mb-4 text-lg">Share this room code with another player:</p>
            <div className="inline-flex items-center gradient-gold rounded-xl px-6 py-3 shadow-gold border border-casino-gold-dark">
              <code className="text-3xl font-mono font-black text-casino-green-dark tracking-wider shimmer">{roomId}</code>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-green/30 shadow-casino">
              <h3 className="font-bold text-casino-green-light mb-4 flex items-center text-lg">
                <Trophy className="w-6 h-6 mr-3 text-casino-gold glow-gold" />
                Scoring System
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white">Each Ace (♠♥♦♣)</span>
                  <Badge className="bg-gradient-to-r from-casino-gold to-casino-gold-dark text-white border-0 shadow-gold">1 pt</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">2 of Spades (2♠)</span>
                  <Badge className="bg-gradient-to-r from-casino-gold to-casino-gold-dark text-white border-0 shadow-gold">1 pt</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">10 of Diamonds (10♦)</span>
                  <Badge className="bg-gradient-to-r from-casino-purple to-casino-purple-dark text-white border-0 shadow-casino">2 pts</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Most cards captured</span>
                  <Badge className="bg-gradient-to-r from-casino-blue to-casino-blue-dark text-white border-0 shadow-casino">2 pts</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white">Most spades captured</span>
                  <Badge className="bg-gradient-to-r from-casino-green to-casino-green-dark text-white border-0 shadow-casino">2 pts</Badge>
                </div>
              </div>
            </div>

            <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-blue/30 shadow-casino">
              <h3 className="font-bold text-casino-blue-light mb-4 flex items-center text-lg">
                <Star className="w-6 h-6 mr-3 text-casino-purple glow-casino" />
                How to Play
              </h3>
              <div className="space-y-3 text-sm">
                <p className="text-white"><strong className="text-casino-blue-light">Capture:</strong> Match your card value with table cards</p>
                <p className="text-white"><strong className="text-casino-purple-light">Build:</strong> Combine table cards to create a sum you can capture</p>
                <p className="text-white"><strong className="text-casino-green-light">Trail:</strong> Place a card on the table when you can't capture</p>
                <div className="mt-4 p-3 backdrop-casino border border-casino-gold/30 rounded-xl">
                  <p className="text-casino-gold font-medium text-xs flex items-center">
                    <span className="text-lg mr-2">⚠️</span>
                    You can only build values that you have cards in hand to capture!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {statisticsEnabled && statistics && (
            <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center justify-center">
                <Crown className="w-5 h-5 mr-2" />
                Your Game Statistics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">{statistics.gamesPlayed}</div>
                  <div className="text-xs text-purple-500">Games</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{statistics.gamesWon}</div>
                  <div className="text-xs text-green-500">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{winRate}%</div>
                  <div className="text-xs text-blue-500">Win Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{statistics.bestScore}</div>
                  <div className="text-xs text-yellow-500">Best Score</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


