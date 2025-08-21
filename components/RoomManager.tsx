import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Users, Trophy, Heart, Diamond, Spade, Club, Crown, Star, AlertTriangle } from 'lucide-react'

interface RoomManagerProps {
  roomId: string
  setRoomId: (roomId: string) => void
  playerName: string
  setPlayerName: (name: string) => void
  onCreateRoom: () => void
  onJoinRoom: (roomId: string, playerName: string) => void
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
  
  // Debug logging
  console.log('🏠 RoomManager render:', { 
    showJoinForm, 
    playerName, 
    roomId, 
    hasPlayerName: !!playerName.trim(),
    hasRoomId: !!roomId.trim()
  });

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setRoomId(result)
  }

  return (
    <div className="w-full" data-testid="room-manager">
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

      <div className="flex items-center justify-center min-h-screen p-4 lg:p-8">
        <div className="w-full max-w-7xl mx-auto" role="main">
          {/* Header with Logo and Title */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-lg opacity-50 animate-pulse-slow"></div>
                <div className="relative bg-casino-green-light rounded-full p-4 shadow-gold border border-casino-gold/30">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                    <span className="text-casino-green-dark font-bold text-xl">3</span>
                  </div>
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4">
              <span className="text-gradient-casino">Casino</span>
              <span className="text-gradient-gold">Cassino</span>
            </h1>
            
            <p className="text-xl text-white/80 font-medium mb-4">
              The Classic Card Capturing Game
            </p>
            
            {/* Decorative Card Suit Icons */}
            <div className="flex justify-center space-x-4 mb-6">
              <Heart className="w-6 h-6 text-casino-red-light" />
              <Diamond className="w-6 h-6 text-casino-blue-light" />
              <Club className="w-6 h-6 text-gray-300" />
              <Spade className="w-6 h-6 text-gray-300" />
            </div>
            
            <div className="flex justify-center space-x-6 text-white/70 text-sm font-medium">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-casino-blue" />
                <span>2 Players</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-casino-gold" />
                <span className="text-white">11 Points to Win</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-casino-purple-light" />
                <span className="text-white">Real-time Online</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="max-w-md mx-auto mb-6" data-testid="error-message">
              <div className="backdrop-casino border border-casino-red/30 rounded-lg p-3 shadow-casino">
                <p className="text-casino-red-light font-medium text-center">{error}</p>
              </div>
            </div>
          )}

          {/* Main Content - Two Panel Layout */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Left Panel - Start Playing */}
            <Card className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-800">Start Playing</CardTitle>
                <CardDescription className="text-gray-600">Create a new room or join an existing game.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="playerName" className="text-sm font-medium text-gray-700 mb-2 block">
                    Your Name
                  </Label>
                  <Input
                    id="playerName"
                    data-testid="player-name-input-create-test"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your player name"
                    className="w-full py-3 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    maxLength={20}
                  />
                </div>

                {!showJoinForm ? (
                  <div className="space-y-4">
                    <Button
                      onClick={onCreateRoom}
                      disabled={!playerName.trim() || isLoading}
                      data-testid="create-room-test"
                      className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating Room...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Crown className="w-5 h-5" />
                          <span>Create New Game</span>
                        </div>
                      )}
                    </Button>

                    <div className="relative">
                      <Separator className="bg-gray-300" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white px-4 text-gray-500 font-medium text-sm">
                          or
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowJoinForm(true)}
                      variant="outline"
                      data-testid="show-join-form-test"
                      className="w-full h-12 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span>Join Existing Game</span>
                      </div>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="roomId" className="text-sm font-medium text-gray-700 mb-2 block">
                        Room Code
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="roomId"
                          data-testid="room-id-input-test"
                          value={roomId}
                          onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                          placeholder="Enter 6-character code"
                          className="flex-1 py-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
                          maxLength={6}
                        />
                        <Button
                          onClick={generateRoomId}
                          variant="outline"
                          className="border-purple-600 text-purple-600 hover:bg-purple-50"
                        >
                          <span className="text-lg">🎲</span>
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={() => onJoinRoom(roomId, playerName)}
                      disabled={!playerName.trim() || !roomId.trim() || isLoading}
                      data-testid="join-room-submit-test"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Joining Game...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Users className="w-5 h-5" />
                          <span>Join Game</span>
                        </div>
                      )}
                    </Button>

                    <Button
                      onClick={() => setShowJoinForm(false)}
                      variant="ghost"
                      data-testid="cancel-join-test"
                      className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    >
                      Back to Create Game
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right Panel - How to Play */}
            <Card className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-gray-800 flex items-center">
                  <Star className="w-6 h-6 mr-2 text-purple-500" />
                  How to Play
                </CardTitle>
                <CardDescription className="text-gray-600">Master the art of card capturing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Scoring Section */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Scoring (11 Points Total)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">A Each Ace</span>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">1 pt</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">2♠ Two of Spades</span>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">1 pt</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">10♦ Ten of Diamonds</span>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">2 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Most Cards Captured</span>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">2 pts</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Most Spades Captured</span>
                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">2 pts</Badge>
                    </div>
                  </div>
                </div>

                {/* Gameplay Section */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <span className="w-6 h-6 mr-2 text-center text-gray-600 font-bold">X</span>
                    Gameplay
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">Capture: Match your card value with table cards</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">Build: Combine table cards to create a sum you can capture</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">Trail: Place a card on the table when you can't capture</span>
                    </div>
                  </div>
                </div>

                {/* Warning Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-yellow-800 text-sm font-medium">
                      Important: You can only build values that you have cards in hand to capture!
                    </span>
                  </div>
                </div>

                {/* Feature Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Real-time Multiplayer</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Smart Hints System</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Sound Effects</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Game Statistics</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="flex items-center justify-center space-x-4 text-white/60 text-sm">
              <span>Powered by KhasinoGaming</span>
              <div className="flex items-center space-x-1">
                <Heart className="w-3 h-3 text-casino-red-light" />
                <Diamond className="w-3 h-3 text-casino-blue-light" />
                <Club className="w-3 h-3 text-gray-300" />
                <Spade className="w-3 h-3 text-gray-300" />
              </div>
              <span>Play responsibly</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}