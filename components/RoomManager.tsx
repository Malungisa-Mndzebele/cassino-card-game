import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Gamepad2, Users, PlayCircle, Shuffle, Target, Layers, FileText } from 'lucide-react'

/**
 * Props for the RoomManager component
 * @interface RoomManagerProps
 */
interface RoomManagerProps {
  /** Current room code value */
  roomId: string
  /** Callback to update room code */
  setRoomId: (roomId: string) => void
  /** Current player name value */
  playerName: string
  /** Callback to update player name */
  setPlayerName: (name: string) => void
  /** Callback to create a new room */
  onCreateRoom: () => void
  /** Callback to join an existing room */
  onJoinRoom: (roomId: string, playerName: string) => void
  /** Optional callback to join a random available room */
  onJoinRandomRoom?: () => void
  /** Error message to display */
  error: string
  /** Whether an operation is in progress */
  isLoading: boolean
}

/**
 * RoomManager Component
 * 
 * Provides the landing page and lobby interface for creating or joining game rooms.
 * Features a casino-themed design with game rules and instructions.
 * 
 * Features:
 * - Create new room with player name
 * - Join existing room with 6-character code
 * - Join random available room (matchmaking)
 * - Display game rules and instructions
 * - Form validation and error handling
 * 
 * @component
 * @example
 * ```tsx
 * <RoomManager
 *   roomId={roomCode}
 *   setRoomId={setRoomCode}
 *   playerName={name}
 *   setPlayerName={setName}
 *   onCreateRoom={() => createNewRoom()}
 *   onJoinRoom={(code, name) => joinExistingRoom(code, name)}
 *   onJoinRandomRoom={() => joinRandom()}
 *   error={errorMessage}
 *   isLoading={loading}
 * />
 * ```
 * 
 * @param {RoomManagerProps} props - Component props
 * @returns {JSX.Element} Rendered room manager interface
 */
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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)

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
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-800 flex items-center justify-center p-4" data-testid="room-manager">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <div className="bg-teal-800/50 rounded-full p-6 shadow-xl">
              <Gamepad2 className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3">
            Casino Card Game
          </h1>
          <p className="text-xl text-teal-100">
            Play the classic Cassino card game online with friends!
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-400 rounded-lg text-white text-center">
            {error}
          </div>
        )}

        {/* Main Action Buttons */}
        {!showCreateForm && !showJoinForm && (
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Create Room Card */}
            <Card className="bg-teal-800/40 border-2 border-teal-600/50 backdrop-blur-sm hover:bg-teal-800/60 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">Create New Room</CardTitle>
                <p className="text-teal-100 text-sm mt-2">Start a new game and invite friends to join</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg"
                  data-testid="show-create-form-button"
                >
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
              </CardContent>
            </Card>

            {/* Join Room Card */}
            <Card className="bg-teal-800/40 border-2 border-teal-600/50 backdrop-blur-sm hover:bg-teal-800/60 transition-all">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">Join Existing Room</CardTitle>
                <p className="text-teal-100 text-sm mt-2">Enter a room code to join an existing game</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => setShowJoinForm(true)}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
                  data-testid="show-join-form-button"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Room
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Room Form */}
        {showCreateForm && (
          <Card className="bg-teal-800/60 border-2 border-teal-600/50 backdrop-blur-sm mb-12">
            <CardHeader className="text-center pb-4 border-b border-teal-600/30">
              <CardTitle className="text-2xl font-bold text-white">Create New Room</CardTitle>
              <p className="text-teal-100 text-sm mt-2">Start a new game and invite friends</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label htmlFor="create-player-name" className="text-white mb-2 block font-medium">
                  Your Name
                </Label>
                <Input
                  id="create-player-name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-teal-900/50 border-teal-600 text-white placeholder:text-teal-300 h-12 text-lg"
                  disabled={isLoading}
                  data-testid="player-name-input-create-test"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreate}
                  disabled={!playerName.trim() || isLoading}
                  className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  data-testid="create-room-test"
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  className="h-12 border-teal-400 text-white hover:bg-teal-700"
                >
                  Cancel
                </Button>
              </div>

              {onJoinRandomRoom && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-teal-600/30" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-teal-800 px-3 py-1 text-teal-200 rounded">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleRandomJoin}
                    disabled={!playerName.trim() || isLoading}
                    variant="outline"
                    className="w-full h-12 border-teal-400 text-white hover:bg-teal-700"
                    data-testid="join-random-room-button"
                  >
                    <Shuffle className="w-5 h-5 mr-2" />
                    Join Random Game
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Join Room Form */}
        {showJoinForm && (
          <Card className="bg-teal-800/60 border-2 border-teal-600/50 backdrop-blur-sm mb-12">
            <CardHeader className="text-center pb-4 border-b border-teal-600/30">
              <CardTitle className="text-2xl font-bold text-white">Join Existing Room</CardTitle>
              <p className="text-teal-100 text-sm mt-2">Enter a room code to join a friend's game</p>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <Label htmlFor="join-player-name" className="text-white mb-2 block font-medium">
                  Your Name
                </Label>
                <Input
                  id="join-player-name"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-teal-900/50 border-teal-600 text-white placeholder:text-teal-300 h-12 text-lg"
                  disabled={isLoading}
                  data-testid="player-name-input-join"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <div>
                <Label htmlFor="room-code" className="text-white mb-2 block font-medium">
                  Room Code
                </Label>
                <Input
                  id="room-code"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="bg-teal-900/50 border-teal-600 text-white placeholder:text-teal-300 h-12 text-lg font-mono tracking-wider"
                  maxLength={6}
                  disabled={isLoading}
                  data-testid="room-code-input"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleJoin}
                  disabled={!playerName.trim() || !roomId.trim() || isLoading}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  data-testid="join-room-test"
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </Button>
                <Button
                  onClick={() => setShowJoinForm(false)}
                  variant="outline"
                  className="h-12 border-teal-400 text-white hover:bg-teal-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How to Play Section */}
        <Card className="bg-teal-800/40 border-2 border-teal-600/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">How to Play</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Capture */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-red-500/20 rounded-full p-4">
                    <Target className="w-8 h-8 text-red-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">🎯 Capture</h3>
                <p className="text-teal-100 text-sm">
                  Match your card value with table cards or combinations
                </p>
              </div>

              {/* Build */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-blue-500/20 rounded-full p-4">
                    <Layers className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">🏗️ Build</h3>
                <p className="text-teal-100 text-sm">
                  Combine table cards to create values you can capture
                </p>
              </div>

              {/* Trail */}
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="bg-yellow-500/20 rounded-full p-4">
                    <FileText className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">📄 Trail</h3>
                <p className="text-teal-100 text-sm">
                  Place a card on the table when you can't capture or build
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-teal-600/30 text-center">
              <p className="text-teal-100 text-sm">
                Made with ❤️ for card game enthusiasts worldwide
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
