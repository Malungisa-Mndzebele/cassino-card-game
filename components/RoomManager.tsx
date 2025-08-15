import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Dice6, Users, Trophy, Heart, Diamond, Spade, Club, Shuffle, Crown, Star } from 'lucide-react'

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
    { icon: Heart, color: 'text-red-500' },
    { icon: Diamond, color: 'text-red-500' },
    { icon: Spade, color: 'text-gray-800' },
    { icon: Club, color: 'text-gray-800' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 transform rotate-12">
          <Heart className="w-20 h-20 text-red-300" />
        </div>
        <div className="absolute top-32 right-16 transform -rotate-45">
          <Spade className="w-16 h-16 text-gray-300" />
        </div>
        <div className="absolute bottom-20 left-20 transform rotate-45">
          <Diamond className="w-24 h-24 text-red-300" />
        </div>
        <div className="absolute bottom-32 right-12 transform -rotate-12">
          <Club className="w-18 h-18 text-gray-300" />
        </div>
        <div className="absolute top-1/2 left-1/4 transform rotate-90">
          <Crown className="w-14 h-14 text-yellow-300" />
        </div>
        <div className="absolute top-1/3 right-1/3 transform -rotate-30">
          <Star className="w-12 h-12 text-yellow-300" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl mx-auto" role="main">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur opacity-30"></div>
                <div className="relative bg-white rounded-full p-4 shadow-2xl">
                  <Shuffle className="w-12 h-12 text-emerald-600" />
                </div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Cassino Card Game
            </h1>
            
            <div className="text-red-500 mt-2">{error}</div>
            
            <div className="flex justify-center items-center space-x-2 mb-6">
              {suitIcons.map((suit, index) => (
                <suit.icon key={index} className={`w-6 h-6 ${suit.color} opacity-80`} />
              ))}
            </div>

            <div className="flex justify-center space-x-6 text-emerald-200 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>2 Players</span>
              </div>
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4" />
                <span>11 Points to Win</span>
              </div>
              <div className="flex items-center space-x-1">
                <Dice6 className="w-4 h-4" />
                <span>Real-time Online</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-8 mb-8" data-testid="room-manager">
            {/* Game Actions */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl text-gray-800">Start Playing</CardTitle>
                <CardDescription className="text-gray-600">
                  Create a new room or join an existing game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Name Input */}
                <div className="space-y-2" role="form">
                  <Label htmlFor="playerName" className="text-gray-700 font-medium">
                    Your Name
                  </Label>
                  <Input
                    id="playerName"
                    data-testid="player-name-input"
                    type="text"
                    placeholder="Enter your player name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    maxLength={20}
                    aria-label="Player Name"
                  />
                </div>

                <Separator className="my-6" />

                {/* Action Buttons */}
                <div className="space-y-4">
                  <Button
                    onClick={onCreateRoom}
                    disabled={!playerName.trim() || isLoading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 text-lg shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                    size="lg"
                    aria-label={isLoading ? "Creating" : "Create Room"}
                  >
                    {isLoading ? (
                      <>
                        <Shuffle className="w-5 h-5 mr-2 animate-spin" />
                        Creating Room...
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5 mr-2" />
                        Create New Game
                      </>
                    )}
                  </Button>

                  <div className="text-center text-gray-500 text-sm">or</div>

                  {!showJoinForm ? (
                    <Button
                      onClick={() => setShowJoinForm(true)}
                      variant="outline"
                      className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium py-3 text-lg"
                      size="lg"
                      aria-label="Show Join Room Form"
                      data-testid="show-join-form"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Join Existing Game
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="Room Code (e.g., ABC123)"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                            className="bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                            maxLength={6}
                            aria-label="Room ID"
                          />
                        </div>
                        <Button
                          onClick={generateRoomId}
                          variant="outline"
                          size="sm"
                          className="px-3 border-gray-300 text-gray-600 hover:bg-gray-50"
                          aria-label="Generate"
                        >
                          <Dice6 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={onJoinRoom}
                          disabled={!roomId.trim() || !playerName.trim() || isLoading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
                          aria-label={isLoading ? "Joining" : "Join Room"}
                          data-testid="join-room-submit"
                        >
                          {isLoading ? (
                            <>
                              <Shuffle className="w-4 h-4 mr-2 animate-spin" />
                              Joining...
                            </>
                          ) : (
                            <>
                              <Users className="w-4 h-4 mr-2" />
                              Join Game
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setShowJoinForm(false)}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                          aria-label="Cancel"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert" aria-live="assertive">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Rules */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-gray-800 flex items-center">
                  <Star className="w-6 h-6 mr-2 text-yellow-500" />
                  How to Play
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Master the art of card capturing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Scoring Rules */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                    Scoring (11 Points Total)
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge variant="secondary" className="mr-2 bg-red-100 text-red-800">A</Badge>
                        Each Ace
                      </span>
                      <Badge className="bg-yellow-500 text-white">1 pt</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge variant="secondary" className="mr-2 bg-gray-100 text-gray-800">2♠</Badge>
                        Two of Spades
                      </span>
                      <Badge className="bg-yellow-500 text-white">1 pt</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <Badge variant="secondary" className="mr-2 bg-red-100 text-red-800">10♦</Badge>
                        Ten of Diamonds
                      </span>
                      <Badge className="bg-yellow-500 text-white">2 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Most Cards Captured</span>
                      <Badge className="bg-yellow-500 text-white">2 pts</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Most Spades Captured</span>
                      <Badge className="bg-yellow-500 text-white">2 pts</Badge>
                    </div>
                  </div>
                </div>

                {/* Gameplay Rules */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                    <Shuffle className="w-5 h-5 mr-2 text-emerald-600" />
                    Gameplay
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Capture:</strong> Match your card value with table cards</p>
                    <p><strong>Build:</strong> Combine table cards to create a sum you can capture</p>
                    <p><strong>Trail:</strong> Place a card on the table when you can't capture</p>
                    <div className="mt-3 p-2 bg-orange-100 rounded-md border-l-4 border-orange-400">
                      <p className="text-orange-800 font-medium">
                        ⚠️ Important: You can only build values that you have cards in hand to capture!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-blue-600 font-medium">Real-time</div>
                    <div className="text-blue-500">Multiplayer</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <div className="text-purple-600 font-medium">Smart</div>
                    <div className="text-purple-500">Hints System</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-green-600 font-medium">Sound</div>
                    <div className="text-green-500">Effects</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2 text-center">
                    <div className="text-orange-600 font-medium">Game</div>
                    <div className="text-orange-500">Statistics</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <div className="text-center text-emerald-200">
            <p className="text-sm">
              Powered by <span className="font-medium text-white">KhasinoGaming</span> • 
              <span className="mx-2">♠️ ♥️ ♦️ ♣️</span> • 
              Play responsibly
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}