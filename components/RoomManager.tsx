import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Crown, Users, PlayCircle, Shuffle, Sparkles, Trophy, Zap, ArrowRight } from 'lucide-react'

interface RoomManagerProps {
  roomId: string
  setRoomId: (roomId: string) => void
  playerName: string
  setPlayerName: (name: string) => void
  onCreateRoom: () => void
  onJoinRoom: (roomId: string, playerName: string) => void
  onJoinRandomRoom?: () => void
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
  onJoinRandomRoom,
  error,
  isLoading
}: RoomManagerProps) {
  const handleJoin = () => {
    if (roomId.trim() && playerName.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), playerName.trim())
    }
  }

  const handleCreate = () => {
    if (playerName.trim()) {
      onCreateRoom()
    }
  }

  const handleRandomJoin = () => {
    if (playerName.trim() && onJoinRandomRoom) {
      onJoinRandomRoom()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4" data-testid="room-manager">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-yellow-400 via-purple-500 to-blue-500 rounded-full blur-xl opacity-60 animate-pulse" />
              <div className="relative bg-gradient-to-br from-purple-600 to-blue-600 rounded-full p-6 shadow-2xl">
                <Crown className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-black text-white mb-3 tracking-tight">
            Casino Card Game
          </h1>
          <p className="text-xl text-purple-200">
            Classic card game • Real-time multiplayer • Compete for victory
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT COLUMN - Create Room */}
          <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border-2 border-emerald-500/30 backdrop-blur-sm shadow-2xl hover:border-emerald-400/50 transition-all duration-300">
            <CardHeader className="text-center pb-6 border-b border-emerald-500/20">
              <div className="flex justify-center mb-4">
                <div className="bg-emerald-500/20 rounded-full p-4">
                  <Sparkles className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Create New Room</CardTitle>
              <p className="text-emerald-200 text-sm">Start a new game and invite friends</p>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Player Name Input */}
              <div>
                <Label htmlFor="create-player-name" className="text-white/90 mb-2 block font-medium">
                  Your Name
                </Label>
                <Input
                  id="create-player-name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-800/50 border-emerald-500/30 text-white placeholder:text-white/40 h-12 text-lg focus:border-emerald-400"
                  disabled={isLoading}
                  data-testid="player-name-input-create-test"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              {/* Create Room Button */}
              <Button
                onClick={handleCreate}
                disabled={!playerName.trim() || isLoading}
                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-lg shadow-lg hover:shadow-emerald-500/50 transition-all"
                data-testid="create-room-test"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Creating Room...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <PlayCircle className="w-6 h-6" />
                    <span>Create New Game</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>

              {/* Quick Join Random */}
              {onJoinRandomRoom && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-emerald-500/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-emerald-950/60 px-3 py-1 text-emerald-300 rounded-full">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleRandomJoin}
                    disabled={!playerName.trim() || isLoading}
                    variant="outline"
                    className="w-full h-12 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-400"
                    data-testid="join-random-room-button"
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    Join Random Game
                  </Button>
                </>
              )}

              {/* Features */}
              <div className="pt-4 space-y-3 border-t border-emerald-500/20">
                <div className="flex items-center gap-3 text-emerald-200 text-sm">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>Instant room creation</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-200 text-sm">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Share room code with friends</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-200 text-sm">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>Real-time multiplayer action</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT COLUMN - Join Room */}
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-950/40 border-2 border-blue-500/30 backdrop-blur-sm shadow-2xl hover:border-blue-400/50 transition-all duration-300">
            <CardHeader className="text-center pb-6 border-b border-blue-500/20">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-500/20 rounded-full p-4">
                  <Users className="w-10 h-10 text-blue-400" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">Join Existing Room</CardTitle>
              <p className="text-blue-200 text-sm">Enter a room code to join a friend's game</p>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Player Name Input */}
              <div>
                <Label htmlFor="join-player-name" className="text-white/90 mb-2 block font-medium">
                  Your Name
                </Label>
                <Input
                  id="join-player-name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-800/50 border-blue-500/30 text-white placeholder:text-white/40 h-12 text-lg focus:border-blue-400"
                  disabled={isLoading}
                  data-testid="player-name-input-join"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              {/* Room Code Input */}
              <div>
                <Label htmlFor="room-code" className="text-white/90 mb-2 block font-medium">
                  Room Code
                </Label>
                <Input
                  id="room-code"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="bg-slate-800/50 border-blue-500/30 text-white placeholder:text-white/40 h-12 text-lg font-mono tracking-wider focus:border-blue-400"
                  maxLength={6}
                  disabled={isLoading}
                  data-testid="room-code-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              {/* Join Room Button */}
              <Button
                onClick={handleJoin}
                disabled={!playerName.trim() || !roomId.trim() || isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg shadow-lg hover:shadow-blue-500/50 transition-all"
                data-testid="join-room-test"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Joining Room...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6" />
                    <span>Join Game</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>

              {/* Features */}
              <div className="pt-4 space-y-3 border-t border-blue-500/20">
                <div className="flex items-center gap-3 text-blue-200 text-sm">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span>Instant connection</span>
                </div>
                <div className="flex items-center gap-3 text-blue-200 text-sm">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Play with friends anywhere</span>
                </div>
                <div className="flex items-center gap-3 text-blue-200 text-sm">
                  <Trophy className="w-4 h-4 text-blue-400" />
                  <span>Compete for the highest score</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-purple-300/60 text-sm">
          <p>First to 11 points wins • Capture cards • Build combinations • Score big!</p>
        </div>
      </div>
    </div>
  )
}
