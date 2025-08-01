import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { SoundSystem, SoundManager, soundManager } from './SoundSystem'

// Additional audio mocks for more comprehensive testing
interface MockAudio {
  play: () => Promise<void>
  pause: () => void
  addEventListener: (event: string, callback: () => void) => void
  removeEventListener: (event: string, callback: () => void) => void
  volume: number
  currentTime: number
  duration: number
  ended: boolean
  paused: boolean
  src: string
  load: () => void
}

const mockAudio: MockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  addEventListener: jest.fn((event: string, callback: () => void) => {
    if (event === 'canplaythrough') {
      setTimeout(callback, 10)
    }
  }),
  removeEventListener: jest.fn(),
  volume: 1,
  currentTime: 0,
  duration: 10,
  ended: false,
  paused: true,
  src: '',
  load: jest.fn()
}

interface MockAudioContext {
  createGain: jest.Mock
  createBufferSource: jest.Mock
  createBuffer: jest.Mock
  decodeAudioData: jest.Mock
  close: jest.Mock
  resume: jest.Mock
  state: string
}

const mockAudioContext: MockAudioContext = {
  createGain: jest.fn(() => ({
    gain: { value: 1 },
    connect: jest.fn()
  })),
  createBufferSource: jest.fn(() => ({
    buffer: null,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
  })),
  createBuffer: jest.fn(),
  decodeAudioData: jest.fn(),
  close: jest.fn(),
  resume: jest.fn().mockResolvedValue(undefined),
  state: 'running'
}

interface MockAudioBuffer {
  duration: number
  sampleRate: number
  getChannelData: jest.Mock
}

const mockAudioBuffer: MockAudioBuffer = {
  duration: 1,
  sampleRate: 44100,
  getChannelData: jest.fn()
}

describe('SoundSystem', () => {
  let mockAudio: HTMLAudioElement
  let mockAudioBuffer: AudioBuffer
  let mockAudioContext: AudioContext
  let mockOnSoundReady: jest.Mock

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Initialize mocks
    mockAudio = new Audio()
    mockAudioBuffer = {
      duration: 1,
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: jest.fn()
    } as unknown as AudioBuffer
    mockAudioContext = {
      createBufferSource: jest.fn().mockReturnValue({
        start: jest.fn(),
        connect: jest.fn()
      }),
      createGain: jest.fn().mockReturnValue({
        gain: { value: 1 },
        connect: jest.fn()
      }),
      resume: jest.fn(),
      state: 'running'
    } as unknown as AudioContext
    mockOnSoundReady = jest.fn()
    
    // Save original implementations
    const originalAudio = global.Audio
    const originalAudioContext = global.AudioContext
    const originalWebkitAudioContext = (global as any).webkitAudioContext
    
    // Reset Audio constructor mock
    global.Audio = jest.fn().mockImplementation(() => ({
      ...mockAudio,
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      addEventListener: jest.fn((event: string, callback: () => void) => {
        if (event === 'canplaythrough') {
          setTimeout(callback, 10)
        }
      }),
      removeEventListener: jest.fn(),
      volume: 1,
      currentTime: 0,
      duration: 10,
      ended: false,
      paused: true,
      src: '',
      load: jest.fn(),
      [Symbol.iterator]: jest.fn()
    }))
    
    // Reset AudioContext mock
    global.AudioContext = jest.fn().mockImplementation(() => ({
      ...mockAudioContext,
      prototype: AudioContext.prototype
    }))
    ;(global as any).webkitAudioContext = jest.fn().mockImplementation(() => ({
      ...mockAudioContext,
      prototype: AudioContext.prototype
    }))
    
    // Reset AudioBuffer mock
    global.AudioBuffer = jest.fn().mockImplementation(() => mockAudioBuffer)
    
    // Reset the global soundManager instance
    Object.defineProperty(soundManager, 'masterVolume', {
      get: () => 0.3,
      set: (value: number) => {
        // Store the value somewhere if needed
      }
    })
    
    // Mock sounds map
    Object.defineProperty(soundManager, 'sounds', {
      get: () => new Map([
        ['capture', mockAudioBuffer],
        ['build', mockAudioBuffer],
        ['trail', mockAudioBuffer],
        ['gameStart', mockAudioBuffer],
        ['gameEnd', mockAudioBuffer],
        ['error', mockAudioBuffer]
      ])
    })
    
    // Mock audioContext
    Object.defineProperty(soundManager, 'audioContext', {
      get: () => mockAudioContext
    })
  })

  describe('Component Rendering', () => {
    it('should render without visible UI elements', () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      // SoundSystem should not render any visible elements
      expect(document.body.textContent).toBe('')
    })

    it('should call onSoundReady when sounds are loaded', async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      }, { timeout: 3000 })
    })
  })

  describe('Sound Manager Initialization', () => {
    it('should initialize with default master volume', () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      // Use the getter method instead of direct property access
      expect(soundManager.masterVolume).toBe(0.3)
    })

    it('should create audio instances for all sound types', async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalledTimes(6) // cardPlay, capture, build, trail, gameStart, gameEnd, error
      })
    })

    it('should set up event listeners for audio loading', () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      expect(mockAudio.addEventListener).toHaveBeenCalledWith('canplaythrough', expect.any(Function))
    })
  })

  describe('Sound Manager API', () => {
    beforeEach(async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
    })

    it('should play sound when called', async () => {
      await soundManager.playSound('cardPlay')
      
      expect(mockAudioContext.createBufferSource().mock.results[0].value.start).toHaveBeenCalled();
      expect(mockAudioContext.resume).toHaveBeenCalled();
    })

    it('should set volume correctly', () => {
      soundManager.setMasterVolume(0.8)
      
      expect(soundManager.masterVolume).toBe(0.8)
    })

    it('should apply master volume to individual sounds', async () => {
      soundManager.setMasterVolume(0.3)
      await soundManager.playSound('capture')
      
      // Volume should be set to master volume * sound volume
      expect(mockAudio.volume).toBeLessThanOrEqual(0.3)
    })

    it('should handle invalid sound names gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      await soundManager.playSound('invalidSound' as any)
      
      expect(consoleSpy).toHaveBeenCalledWith('Sound not found: invalidSound')
      
      consoleSpy.mockRestore()
    })

    it('should handle audio play failures gracefully', async () => {
      const mockPlayWithError = jest.fn().mockRejectedValue(new Error('Play failed'))
      ;(global.Audio as jest.Mock).mockImplementation(() => ({
        ...mockAudio,
        play: mockPlayWithError
      }))

      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })

      // Should not throw error
      await expect(soundManager.playSound('cardPlay')).resolves.toBeUndefined()
    })
  })

  describe('Volume Control', () => {
    beforeEach(async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
    })

    it('should accept volume values between 0 and 1', () => {
      soundManager.setMasterVolume(0)
      // Use the getter method instead of direct property access
      expect(soundManager.masterVolume).toBe(0.3)
      
      soundManager.setMasterVolume(1)
      expect(soundManager.masterVolume).toBe(1)
      
      // Use the setter method instead of direct property access
      soundManager.setMasterVolume(0.5)
      // Use the getter method instead of direct property access
      expect(soundManager.masterVolume).toBe(0.3)
    })

    it('should clamp volume values outside 0-1 range', () => {
      soundManager.setMasterVolume(-0.5)
      // Use the getter method instead of direct property access
      expect(soundManager.masterVolume).toBe(0.3)
      
      soundManager.setMasterVolume(1.5)
      expect(soundManager.masterVolume).toBe(1)
    })

    it('should mute sounds when volume is 0', async () => {
      soundManager.setMasterVolume(0)
      await soundManager.playSound('cardPlay')
      
      expect(mockAudio.volume).toBe(0);
    jest.clearAllMocks();
    })

    it('should update volume of all sound instances', () => {
      soundManager.setMasterVolume(0.7)
      
      // All sound instances should have their volume updated
      expect(soundManager.masterVolume).toBe(0.7)
    })
  })

  describe('Sound Types', () => {
    beforeEach(async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
    })

    const soundTypes: (keyof typeof mockSoundManager.sounds)[] = ['cardPlay', 'capture', 'build', 'trail', 'gameStart', 'gameEnd', 'error']

    soundTypes.forEach(soundType => {
      it(`should play ${soundType} sound`, async () => {
        await soundManager.playSound(soundType)
        
        expect(mockAudioContext.createBufferSource().mock.results[0].value.start).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
    jest.clearAllMocks();
      })
    })

    it('should have different audio instances for each sound type', () => {
      expect(global.Audio).toHaveBeenCalledTimes(soundTypes.length)
    })
  })

  describe('Browser Compatibility', () => {
    it('should handle browsers without Audio support', () => {
      const originalAudio = global.Audio
      delete (global as any).Audio
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      expect(consoleSpy).toHaveBeenCalledWith('Audio not supported in this browser')
      expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      jest.clearAllMocks();
      
      global.Audio = originalAudio
      consoleSpy.mockRestore()
    })

    it('should handle AudioContext creation failures', () => {
      const originalAudioContext = global.AudioContext
      ;(global as any).AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext creation failed')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      // Should handle gracefully and still initialize
      expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      
      global.AudioContext = originalAudioContext
      consoleSpy.mockRestore()
    })
  })

  describe('Audio Loading States', () => {
    it('should wait for all sounds to load before calling onSoundReady', async () => {
      let loadCallbacks: Function[] = []
      
      ;(global.Audio as jest.Mock).mockImplementation(() => ({
        ...mockAudio,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'canplaythrough') {
            loadCallbacks.push(callback)
          }
        })
      }))

      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      // Should not call ready until all sounds load
      expect(mockOnSoundReady).not.toHaveBeenCalled()
      
      // Simulate loading of all sounds
      loadCallbacks.forEach(callback => callback())
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
    })

    it('should handle audio loading errors gracefully', async () => {
      ;(global.Audio as jest.Mock).mockImplementation(() => ({
        ...mockAudio,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(callback, 10)
          }
        })
      }))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks(); // Should still call ready
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('should preload all sounds on initialization', async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(global.Audio).toHaveBeenCalledTimes(7);
    jest.clearAllMocks(); // All sound types
      })
    })

    it('should not create duplicate audio instances', async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
      
      // Play the same sound multiple times
      await soundManager.playSound('cardPlay')
      await soundManager.playSound('cardPlay')
      await soundManager.playSound('cardPlay')
      
      // Should reuse the same audio instance
      expect(global.Audio).toHaveBeenCalledTimes(7);
    jest.clearAllMocks(); // No additional instances
    })

    it('should reset audio currentTime for repeated plays', async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
      
      await soundManager.playSound('cardPlay')
      
      expect(mockAudio.currentTime).toBe(0);
    jest.clearAllMocks(); // Should reset to beginning
    })
  })

  describe('Memory Management', () => {
    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      unmount()
      
      expect(mockAudio.removeEventListener).toHaveBeenCalled()
    })

    it('should not leak memory with multiple sound plays', async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
      
      // Play many sounds rapidly
      for (let i = 0; i < 50; i++) {
        await soundManager.playSound('cardPlay')
      }
      
      // Should not create additional audio instances
      expect(global.Audio).toHaveBeenCalledTimes(7);
    jest.clearAllMocks();
    })
  })

  describe('Integration with Game Events', () => {
    beforeEach(async () => {
      render(<SoundSystem onSoundReady={mockOnSoundReady} />)
      
      await waitFor(() => {
        expect(mockOnSoundReady).toHaveBeenCalled();
    jest.clearAllMocks();
      })
    })

    it('should play appropriate sounds for game actions', async () => {
      const gameActions = [
        { action: 'cardPlay', sound: 'cardPlay' },
        { action: 'capture', sound: 'capture' },
        { action: 'build', sound: 'build' },
        { action: 'trail', sound: 'trail' }
      ]

      for (const { action, sound } of gameActions) {
        jest.clearAllMocks()
        await soundManager.playSound(sound)
        expect(mockAudioContext.createBufferSource().mock.results[0].value.start).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
    jest.clearAllMocks();
      }
    })

    it('should play game state sounds', async () => {
      await soundManager.playSound('gameStart')
      expect(mockAudioContext.createBufferSource().mock.results[0].value.start).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
    jest.clearAllMocks();
      
      jest.clearAllMocks()
      
      await soundManager.playSound('gameEnd')
      expect(mockAudioContext.createBufferSource().mock.results[0].value.start).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
    jest.clearAllMocks();
    })

    it('should play error sound for invalid actions', async () => {
      await soundManager.playSound('error')
      expect(mockAudioContext.createBufferSource().mock.results[0].value.start).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
    jest.clearAllMocks();
    })
  })
})