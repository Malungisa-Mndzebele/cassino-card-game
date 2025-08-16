import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Dice6, Users, Trophy, Heart, Diamond, Spade, Club, Shuffle, Crown, Star, Sparkles, Zap } from 'lucide-react'

interface RoomManagerProps {
  roomId: string
  setRoomId: (roomId: string) => void
  playerName: string
  setPlayerName: (name: string) => void
  onCreateRoom: () => void
  onJoinRoom: () => void
  error: string
  isLoading: boolean
}

export function RoomManager({
  roomId,
  setRoomId,
  playerName,
  setPlayerName,
  onCreateRoom,
  onJoinRoom,
  error,
  isLoading
}: RoomManagerProps) {
  const [showJoinForm, setShowJoinForm] = useState(false)

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setRoomId(result)
  }

  const suitIcons = [
    { icon: Heart, color: 'text-casino-red-light' },
    { icon: Diamond, color: 'text-casino-blue-light' },
    { icon: Spade, color: 'text-white' },
    { icon: Club, color: 'text-white' }
  ]

  return (
    <div className="min-h-screen gradient-casino-vibrant relative overflow-hidden" data-testid="room-manager">
      {/* Enhanced Animated background particles */}
      <div className="particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 4 + 3}s`,
            }}
          />
        ))}
      </div>

      {/* Enhanced Decorative Background Elements */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-10 left-10 transform rotate-12 floating">
          <Heart className="w-24 h-24 text-casino-red-light glow-casino" />
        </div>
        <div className="absolute top-32 right-16 transform -rotate-45 floating" style={{ animationDelay: '1s' }}>
          <Spade className="w-20 h-20 text-white glow-casino" />
        </div>
        <div className="absolute bottom-20 left-20 transform rotate-45 floating" style={{ animationDelay: '2s' }}>
          <Diamond className="w-28 h-28 text-casino-blue-light glow-casino" />
        </div>
        <div className="absolute bottom-32 right-12 transform -rotate-12 floating" style={{ animationDelay: '3s' }}>
          <Club className="w-22 h-22 text-white glow-casino" />
        </div>
        <div className="absolute top-1/2 left-1/4 transform rotate-90 floating" style={{ animationDelay: '0.5s' }}>
          <Crown className="w-18 h-18 text-casino-gold glow-gold" />
        </div>
        <div className="absolute top-1/3 right-1/3 transform -rotate-30 floating" style={{ animationDelay: '1.5s' }}>
          <Star className="w-16 h-16 text-casino-purple-light glow-casino" />
        </div>
        <div className="absolute top-2/3 left-3/4 transform rotate-180 floating" style={{ animationDelay: '2.5s' }}>
          <Sparkles className="w-14 h-14 text-casino-gold glow-gold" />
        </div>
        <div className="absolute bottom-1/3 right-2/3 transform -rotate-60 floating" style={{ animationDelay: '4s' }}>
          <Zap className="w-12 h-12 text-casino-purple glow-casino" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 lg:p-8">
        <div className="w-full max-w-5xl mx-auto" role="main">
          {/* Enhanced Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-8">
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-lg opacity-60 animate-pulse-slow"></div>
                <div className="relative backdrop-casino-dark rounded-full p-6 shadow-glow-gold border border-casino-gold/30">
                  <Shuffle className="w-16 h-16 text-casino-gold glow-gold animate-pulse-slow" />
                </div>
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-gradient-casino mb-6 tracking-tight">
              Cassino
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 font-medium mb-8 max-w-2xl mx-auto">
              The Classic Card Game • Real-time Multiplayer • Pure Strategy
            </p>
            
            {error && (
              <div className="backdrop-casino-dark border border-casino-red/50 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <div className="text-casino-red-light font-medium" data-testid="error-message-test">{error}</div>
              </div>
            )}
            
            <div className="flex justify-center items-center space-x-3 mb-8">
              {suitIcons.map((suit, index) => (
                <div key={index} className="floating" style={{ animationDelay: `${index * 0.2}s` }}>
                  <suit.icon className={`w-8 h-8 ${suit.color} glow-casino`} />
                </div>
              ))}
            </div>

            <div className="flex justify-center space-x-8 text-white/70 text-sm font-medium">
              <div className="flex items-center space-x-2 backdrop-casino-dark px-4 py-2 rounded-full">
                <Users className="w-5 h-5 text-casino-blue" />
                <span>2 Players</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-casino-dark px-4 py-2 rounded-full">
                <Trophy className="w-5 h-5 text-casino-gold" />
                <span>Skill-Based</span>
              </div>
              <div className="flex items-center space-x-2 backdrop-casino-dark px-4 py-2 rounded-full">
                <Dice6 className="w-5 h-5 text-casino-purple" />
                <span>Classic Rules</span>
              </div>
            </div>
          </div>

          {/* Enhanced Main Game Entry */}
          <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto">
            <Card className="backdrop-casino border-0 shadow-casino-lg overflow-hidden">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="backdrop-casino-dark rounded-xl p-6 mb-6 border border-casino-green/30">
                    <Label htmlFor="playerName" className="text-casino-green-light font-medium text-lg mb-3 block">
                      Enter Your Name
                    </Label>
                    <Input
                      id="playerName"
                      data-testid="player-name-input-create-test"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your display name"
                      className="text-center text-lg py-3 backdrop-casino border-casino-green/50 text-white placeholder:text-white/50 focus:border-casino-gold focus:ring-casino-gold/30"
                      maxLength={20}
                    />
                  </div>

                  {!showJoinForm ? (
                    <div className="space-y-6">
                      <Button
                        onClick={onCreateRoom}
                        disabled={!playerName.trim() || isLoading}
                        data-testid="create-room-test"
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-casino-green to-casino-green-light hover:from-casino-green-light hover:to-casino-green text-white shadow-casino border-0 rounded-xl transition-all duration-300 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="casino-spinner w-5 h-5"></div>
                            <span>Creating Room...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Crown className="w-6 h-6" />
                            <span>Create New Game</span>
                          </div>
                        )}
                      </Button>

                      <div className="relative">
                        <Separator className="bg-casino-gold/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="backdrop-casino-dark px-4 py-1 text-casino-gold font-medium text-sm rounded-full border border-casino-gold/30">
                            OR
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShowJoinForm(true)}
                        variant="outline"
                        data-testid="show-join-form-test"
                        className="w-full h-14 text-lg font-bold border-casino-blue text-casino-blue hover:bg-casino-blue/10 hover:border-casino-blue-light backdrop-casino-dark rounded-xl transition-all duration-300"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="w-6 h-6" />
                          <span>Join Existing Game</span>
                        </div>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="backdrop-casino-dark rounded-xl p-6 border border-casino-blue/30">
                        <Label htmlFor="roomId" className="text-casino-blue-light font-medium text-lg mb-3 block">
                          Room Code
                        </Label>
                        <div className="flex space-x-3">
                          <Input
                            id="roomId"
                            data-testid="room-id-input-test"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            placeholder="Enter 6-character code"
                            className="text-center text-lg py-3 backdrop-casino border-casino-blue/50 text-white placeholder:text-white/50 focus:border-casino-gold focus:ring-casino-gold/30 font-mono"
                            maxLength={6}
                          />
                          <Button
                            onClick={generateRoomId}
                            variant="outline"
                            className="border-casino-purple text-casino-purple hover:bg-casino-purple/10 hover:border-casino-purple-light backdrop-casino-dark"
                          >
                            <Dice6 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={onJoinRoom}
                        disabled={!playerName.trim() || !roomId.trim() || isLoading}
                        data-testid="join-room-submit-test"
                        className="w-full h-14 text-lg font-bold bg-gradient-to-r from-casino-blue to-casino-blue-light hover:from-casino-blue-light hover:to-casino-blue text-white shadow-casino border-0 rounded-xl transition-all duration-300 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="casino-spinner w-5 h-5"></div>
                            <span>Joining Game...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <Zap className="w-6 h-6" />
                            <span>Join Game</span>
                          </div>
                        )}
                      </Button>

                      <Button
                        onClick={() => setShowJoinForm(false)}
                        variant="ghost"
                        data-testid="cancel-join-test"
                        className="w-full text-white/70 hover:text-white hover:bg-white/5"
                      >
                        Back to Create Game
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Game Features */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-green/30 text-center shadow-casino">
              <div className="backdrop-casino rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-casino-green/20">
                <Trophy className="w-8 h-8 text-casino-gold glow-gold" />
              </div>
              <h3 className="font-bold text-casino-green-light mb-2 text-lg">Strategic Gameplay</h3>
              <p className="text-white/70 text-sm">Master the art of capturing, building, and trailing in this classic card game.</p>
            </div>

            <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-blue/30 text-center shadow-casino">
              <div className="backdrop-casino rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-casino-blue/20">
                <Zap className="w-8 h-8 text-casino-purple glow-casino" />
              </div>
              <h3 className="font-bold text-casino-blue-light mb-2 text-lg">Real-time Play</h3>
              <p className="text-white/70 text-sm">Experience smooth, real-time multiplayer action with instant updates.</p>
            </div>

            <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-purple/30 text-center shadow-casino">
              <div className="backdrop-casino rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-casino-purple/20">
                <Crown className="w-8 h-8 text-casino-gold glow-gold" />
              </div>
              <h3 className="font-bold text-casino-purple-light mb-2 text-lg">Premium Experience</h3>
              <p className="text-white/70 text-sm">Beautiful animations, sound effects, and an immersive casino atmosphere.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}