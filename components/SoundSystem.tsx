import { useEffect, useRef } from 'react'

interface SoundSystemProps {
  onSoundReady?: () => void
}

export class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<string, AudioBuffer> = new Map()
  private masterVolume: number = 0.3

  async initialize() {
    if (this.audioContext) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create simple sound effects programmatically
      await this.createSounds()
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
    }
  }

  private async createSounds() {
    if (!this.audioContext) return

    // Capture sound - ascending chime
    const captureBuffer = this.createTone([440, 554, 659], 0.3, 'sine')
    this.sounds.set('capture', captureBuffer)

    // Build sound - building chime
    const buildBuffer = this.createTone([330, 415, 523], 0.4, 'triangle')
    this.sounds.set('build', buildBuffer)

    // Trail sound - simple note
    const trailBuffer = this.createTone([294], 0.2, 'sine')
    this.sounds.set('trail', trailBuffer)

    // Game start sound - fanfare
    const startBuffer = this.createTone([261, 329, 392, 523], 0.6, 'square')
    this.sounds.set('gameStart', startBuffer)

    // Game end sound - resolution
    const endBuffer = this.createTone([523, 440, 349, 261], 0.8, 'sine')
    this.sounds.set('gameEnd', endBuffer)

    // Error sound - dissonant
    const errorBuffer = this.createTone([200, 150], 0.3, 'sawtooth')
    this.sounds.set('error', errorBuffer)
  }

  private createTone(frequencies: number[], duration: number, waveType: OscillatorType = 'sine'): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized')

    const sampleRate = this.audioContext.sampleRate
    const length = sampleRate * duration
    const buffer = this.audioContext.createBuffer(1, length, sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < length; i++) {
      let sample = 0
      const time = i / sampleRate
      
      // Create envelope (fade in/out)
      const envelope = Math.sin((i / length) * Math.PI)
      
      // Mix frequencies
      for (const freq of frequencies) {
        const noteTime = time * (frequencies.indexOf(freq) + 1) / frequencies.length
        if (noteTime <= duration / frequencies.length) {
          sample += Math.sin(2 * Math.PI * freq * noteTime) * envelope * (1 / frequencies.length)
        }
      }
      
      data[i] = sample * this.masterVolume
    }

    return buffer
  }

  async playSound(soundName: string, volume: number = 1) {
    if (!this.audioContext || !this.sounds.has(soundName)) return

    try {
      // Resume audio context if suspended (required by browser policies)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      const buffer = this.sounds.get(soundName)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = buffer
      gainNode.gain.value = volume * this.masterVolume

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      source.start()
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error)
    }
  }

  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }
}

// Global sound manager instance
export const soundManager = new SoundManager()

export function SoundSystem({ onSoundReady }: SoundSystemProps) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      soundManager.initialize().then(() => {
        onSoundReady?.()
      })
    }
  }, [onSoundReady])

  return null
}