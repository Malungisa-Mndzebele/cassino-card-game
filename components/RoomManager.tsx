import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Crown, Users, PlayCircle } from 'lucide-react'

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

  const handleJoin = () => {
    if (roomId.trim() && playerName.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), playerName.trim())
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-2 border-purple-500/30 shadow-2xl" data-testid="room-manager">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center items-center mb-4">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-full blur-lg opacity-50" />
            <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
        <CardTitle className="text-4xl font-black text-white mb-2">Cassino</CardTitle>
        <p className="text-white/80 font-medium">Play the classic card game online</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Player Name Input */}
        <div>
          <Label htmlFor="playerName" className="text-white/90 mb-2 block">Your Name</Label>
          <Input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-white/50"
            disabled={isLoading}
            data-testid="player-name-input-create-test"
            onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && !showJoinForm && onCreateRoom()}
          />
        </div>

        {!showJoinForm ? (
          <div className="space-y-4">
            <Button
              onClick={onCreateRoom}
              disabled={!playerName.trim() || isLoading}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold text-lg"
              data-testid="create-room-test"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>Create New Game</span>
                </div>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-2 text-white/60">or</span>
              </div>
            </div>

            <Button
              onClick={() => setShowJoinForm(true)}
              disabled={!playerName.trim() || isLoading}
              variant="outline"
              className="w-full h-12 border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              data-testid="show-join-form-test"
            >
              <Users className="w-5 h-5 mr-2" />
              Join Existing Game
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label htmlFor="roomId" className="text-white/90 mb-2 block">Room Code</Label>
              <Input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code"
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-white/50 font-mono"
                maxLength={6}
                disabled={isLoading}
                data-testid="room-id-input-test"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowJoinForm(false)}
                variant="outline"
                className="flex-1 h-12 border-slate-600 text-white/80 hover:bg-slate-700/50"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleJoin}
                disabled={!playerName.trim() || !roomId.trim() || isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                data-testid="join-room-submit-test"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Joining...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>Join Room</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
