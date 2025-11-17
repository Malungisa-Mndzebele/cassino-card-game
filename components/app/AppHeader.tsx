import React from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { LogOut, Users, Trophy } from 'lucide-react'

/**
 * Props for the AppHeader component
 * @interface AppHeaderProps
 */
interface AppHeaderProps {
  /** 6-character room code */
  roomId: string
  /** Current WebSocket connection status */
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  /** Current player's name */
  myName: string
  /** Opponent player's name */
  opponentName: string
  /** Current player's score */
  myScore: number
  /** Opponent player's score */
  opponentScore: number
  /** Optional current game phase */
  phase?: string
  /** Optional current round number */
  round?: number
  /** Callback when leave button is clicked */
  onLeave: () => void
}

/**
 * AppHeader Component
 * 
 * Displays the game header with room information, connection status,
 * player scores, and leave game button. Shown during non-gameplay phases.
 * 
 * @component
 * @example
 * ```tsx
 * <AppHeader
 *   roomId="ABC123"
 *   connectionStatus="connected"
 *   myName="Alice"
 *   opponentName="Bob"
 *   myScore={5}
 *   opponentScore={3}
 *   phase="round1"
 *   round={1}
 *   onLeave={() => leaveGame()}
 * />
 * ```
 * 
 * @param {AppHeaderProps} props - Component props
 * @returns {JSX.Element} Rendered header component
 */
export function AppHeader({
  roomId,
  connectionStatus,
  myName,
  opponentName,
  myScore,
  opponentScore,
  phase,
  round,
  onLeave
}: AppHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-xl p-4 mb-4 border border-purple-500/30 shadow-lg">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left: Room Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-white font-mono font-bold">{roomId}</span>
              </div>
          <Badge className={
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }>
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             'Disconnected'}
          </Badge>
          </div>

        {/* Center: Scores */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-white/60 mb-1">{myName}</div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-2xl font-bold text-white">{myScore}</span>
              </div>
            </div>
          <div className="text-white/40">vs</div>
            <div className="text-center">
            <div className="text-xs text-white/60 mb-1">{opponentName}</div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-bold text-white">{opponentScore}</span>
              </div>
            </div>
          </div>

        {/* Right: Leave Button */}
              <Button
                onClick={onLeave}
                variant="outline"
                size="sm"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
          <LogOut className="w-4 h-4 mr-2" />
          Leave
              </Button>
            </div>

      {/* Phase/Round Info */}
      {(phase || round) && (
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <span className="text-white/60 text-sm">
            {phase && <span className="capitalize">{phase}</span>}
            {round && <span> • Round {round}</span>}
          </span>
          </div>
      )}
        </div>
  )
}
