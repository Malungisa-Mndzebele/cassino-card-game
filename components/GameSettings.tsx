import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Badge } from './ui/badge'
import { Settings, BarChart3, Lightbulb, Volume2, VolumeX } from 'lucide-react'

export interface GamePreferences {
  hintsEnabled: boolean
  statisticsEnabled: boolean
  soundEnabled: boolean
  soundVolume: number
}

interface GameSettingsProps {
  preferences: GamePreferences
  onPreferencesChange: (preferences: GamePreferences) => void
  statistics?: GameStatistics
}

export interface GameStatistics {
  gamesPlayed: number
  gamesWon: number
  gamesLost: number
  totalScore: number
  bestScore: number
  averageScore: number
  longestWinStreak: number
  currentWinStreak: number
  captureRate: number // percentage of successful captures
  buildRate: number // percentage of successful builds
}

export function GameSettings({ preferences, onPreferencesChange, statistics }: GameSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showStats, setShowStats] = useState(false)

  const updatePreference = <K extends keyof GamePreferences>(
    key: K,
    value: GamePreferences[K]
  ) => {
    onPreferencesChange({
      ...preferences,
      [key]: value
    })
  }

  const resetStatistics = () => {
    if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      // This would be handled by the parent component
      const event = new CustomEvent('resetStatistics')
      window.dispatchEvent(event)
    }
  }

  const winRate = statistics ? (statistics.gamesWon / Math.max(1, statistics.gamesPlayed) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Game Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sound Settings */}
          <div className="space-y-3">
            <h3 className="font-medium">Sound Effects</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {preferences.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                <Label htmlFor="sound-enabled">Enable Sounds</Label>
              </div>
              <Switch
                id="sound-enabled"
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
              />
            </div>
            {preferences.soundEnabled && (
              <div className="pl-6">
                <Label htmlFor="volume">Volume: {Math.round(preferences.soundVolume * 100)}%</Label>
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={preferences.soundVolume}
                  onChange={(e) => updatePreference('soundVolume', parseFloat(e.target.value))}
                  className="w-full mt-1"
                />
              </div>
            )}
          </div>

          {/* Gameplay Assistance */}
          <div className="space-y-3">
            <h3 className="font-medium">Gameplay Assistance</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <Label htmlFor="hints-enabled">Show Hints</Label>
              </div>
              <Switch
                id="hints-enabled"
                checked={preferences.hintsEnabled}
                onCheckedChange={(checked) => updatePreference('hintsEnabled', checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Highlights possible captures and builds
            </p>
          </div>

          {/* Statistics */}
          <div className="space-y-3">
            <h3 className="font-medium">Statistics</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <Label htmlFor="stats-enabled">Track Statistics</Label>
              </div>
              <Switch
                id="stats-enabled"
                checked={preferences.statisticsEnabled}
                onCheckedChange={(checked) => updatePreference('statisticsEnabled', checked)}
              />
            </div>
            
            {preferences.statisticsEnabled && statistics && (
              <div className="pl-6 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                >
                  {showStats ? 'Hide' : 'Show'} Stats
                </Button>
                
                {showStats && (
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-medium">Games Played</p>
                        <Badge variant="secondary">{statistics.gamesPlayed}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">Win Rate</p>
                        <Badge variant="default">{winRate.toFixed(1)}%</Badge>
                      </div>
                      <div>
                        <p className="font-medium">Best Score</p>
                        <Badge variant="secondary">{statistics.bestScore}/11</Badge>
                      </div>
                      <div>
                        <p className="font-medium">Avg Score</p>
                        <Badge variant="secondary">{statistics.averageScore.toFixed(1)}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">Win Streak</p>
                        <Badge variant="default">{statistics.currentWinStreak}</Badge>
                      </div>
                      <div>
                        <p className="font-medium">Best Streak</p>
                        <Badge variant="secondary">{statistics.longestWinStreak}</Badge>
                      </div>
                    </div>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={resetStatistics}
                      className="w-full mt-2"
                    >
                      Reset Statistics
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t">
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing preferences
export function useGamePreferences(): [GamePreferences, (prefs: GamePreferences) => void] {
  const [preferences, setPreferences] = useState<GamePreferences>({
    hintsEnabled: false,
    statisticsEnabled: false,
    soundEnabled: true,
    soundVolume: 0.7
  })

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('cassino-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences({ ...preferences, ...parsed })
      } catch (e) {
        console.error('Failed to load preferences:', e)
      }
    }
  }, [])

  const updatePreferences = (newPreferences: GamePreferences) => {
    setPreferences(newPreferences)
    localStorage.setItem('cassino-preferences', JSON.stringify(newPreferences))
  }

  return [preferences, updatePreferences]
}

// Hook for managing statistics
export function useGameStatistics(): [GameStatistics, (update: Partial<GameStatistics>) => void, () => void] {
  const [statistics, setStatistics] = useState<GameStatistics>({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalScore: 0,
    bestScore: 0,
    averageScore: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    captureRate: 0,
    buildRate: 0
  })

  useEffect(() => {
    // Load statistics from localStorage
    const saved = localStorage.getItem('cassino-statistics')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setStatistics({ ...statistics, ...parsed })
      } catch (e) {
        console.error('Failed to load statistics:', e)
      }
    }

    // Listen for reset event
    const handleReset = () => {
      const defaultStats: GameStatistics = {
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        longestWinStreak: 0,
        currentWinStreak: 0,
        captureRate: 0,
        buildRate: 0
      }
      setStatistics(defaultStats)
      localStorage.setItem('cassino-statistics', JSON.stringify(defaultStats))
    }

    window.addEventListener('resetStatistics', handleReset)
    return () => window.removeEventListener('resetStatistics', handleReset)
  }, [])

  const updateStatistics = (update: Partial<GameStatistics>) => {
    const newStats = { ...statistics, ...update }
    
    // Recalculate derived values
    if (newStats.gamesPlayed > 0) {
      newStats.averageScore = newStats.totalScore / newStats.gamesPlayed
    }
    
    setStatistics(newStats)
    localStorage.setItem('cassino-statistics', JSON.stringify(newStats))
  }

  const reset = () => {
    const defaultStats: GameStatistics = {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalScore: 0,
      bestScore: 0,
      averageScore: 0,
      longestWinStreak: 0,
      currentWinStreak: 0,
      captureRate: 0,
      buildRate: 0
    }
    setStatistics(defaultStats)
    localStorage.setItem('cassino-statistics', JSON.stringify(defaultStats))
  }

  return [statistics, updateStatistics, reset]
}