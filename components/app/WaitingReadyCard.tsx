import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

interface WaitingReadyCardProps {
  roomId: string
  playerId: number
  player1Ready: boolean
  player2Ready: boolean
  isPlayer1: boolean
  onSetReady: (isReady: boolean) => Promise<void> | void
}

export function WaitingReadyCard({
  roomId,
  playerId,
  player1Ready,
  player2Ready,
  isPlayer1,
  onSetReady,
}: WaitingReadyCardProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Waiting for Players</h2>
          <p className="text-gray-600">
            Room: <span className="font-mono font-bold text-blue-600">{roomId}</span>
          </p>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full ${player1Ready ? 'bg-green-500' : 'bg-gray-300'} mb-2`}></div>
              <span className="text-sm text-gray-600">Player 1</span>
            </div>
            <div className="text-center">
              <div className={`w-3 h-3 rounded-full ${player2Ready ? 'bg-green-500' : 'bg-gray-300'} mb-2`}></div>
              <span className="text-sm text-gray-600">Player 2</span>
            </div>
          </div>

          {playerId && (
            <div className="space-y-3">
              <p className="text-gray-600">Are you ready to start the game?</p>
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={async () => onSetReady(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isPlayer1 ? player1Ready : player2Ready}
                >
                  {isPlayer1 ? (player1Ready ? 'Ready!' : "I'm Ready!") : (player2Ready ? 'Ready!' : "I'm Ready!")}
                </Button>
                <Button
                  onClick={async () => onSetReady(false)}
                  variant="outline"
                  disabled={isPlayer1 ? !player1Ready : !player2Ready}
                >
                  Not Ready
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


