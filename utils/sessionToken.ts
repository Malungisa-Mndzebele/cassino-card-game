/**
 * Session Token Management
 * Handles session token storage and retrieval in localStorage
 */

export interface SessionToken {
  roomId: string
  playerId: number
  playerName: string
  signature: string
  nonce: string
  createdAt: number
  expiresAt: number
  version: number
}

export class SessionTokenManager {
  private static readonly KEY_PREFIX = 'casino_session_'
  private static readonly EXPIRATION_HOURS = 24

  /**
   * Create and store a session token
   */
  static createToken(roomId: string, playerId: number, playerName: string, tokenString: string): void {
    try {
      const key = this.getKey(roomId)
      localStorage.setItem(key, tokenString)
      
      if (import.meta.env.DEV) {
        console.log('✅ Session token stored for room:', roomId)
      }
    } catch (error) {
      console.error('Failed to store session token:', error)
      // Fallback to sessionStorage if localStorage is full
      try {
        const key = this.getKey(roomId)
        sessionStorage.setItem(key, tokenString)
      } catch (fallbackError) {
        console.error('Failed to store in sessionStorage:', fallbackError)
      }
    }
  }

  /**
   * Get session token for a room
   */
  static getToken(roomId: string): string | null {
    try {
      const key = this.getKey(roomId)
      
      // Try localStorage first
      let token = localStorage.getItem(key)
      
      // Fallback to sessionStorage
      if (!token) {
        token = sessionStorage.getItem(key)
      }
      
      if (token) {
        // Validate token hasn't expired
        if (this.validateToken(token)) {
          return token
        } else {
          // Token expired, remove it
          this.clearToken(roomId)
          return null
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to get session token:', error)
      return null
    }
  }

  /**
   * Validate token expiration
   */
  static validateToken(tokenString: string): boolean {
    try {
      // Decode base64 token
      const decoded = atob(tokenString)
      const token: SessionToken = JSON.parse(decoded)
      
      // Check version
      if (token.version !== 1) {
        return false
      }
      
      // Check expiration
      const now = Date.now()
      if (now > token.expiresAt) {
        return false
      }
      
      return true
    } catch (error) {
      console.error('Failed to validate token:', error)
      return false
    }
  }

  /**
   * Parse token string to object
   */
  static parseToken(tokenString: string): SessionToken | null {
    try {
      const decoded = atob(tokenString)
      return JSON.parse(decoded)
    } catch (error) {
      console.error('Failed to parse token:', error)
      return null
    }
  }

  /**
   * Clear token for a room
   */
  static clearToken(roomId: string): void {
    try {
      const key = this.getKey(roomId)
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
      
      if (import.meta.env.DEV) {
        console.log('🗑️ Session token cleared for room:', roomId)
      }
    } catch (error) {
      console.error('Failed to clear session token:', error)
    }
  }

  /**
   * Clear all session tokens
   */
  static clearAllTokens(): void {
    try {
      // Clear from localStorage
      const localKeys = Object.keys(localStorage)
      for (const key of localKeys) {
        if (key.startsWith(this.KEY_PREFIX)) {
          localStorage.removeItem(key)
        }
      }
      
      // Clear from sessionStorage
      const sessionKeys = Object.keys(sessionStorage)
      for (const key of sessionKeys) {
        if (key.startsWith(this.KEY_PREFIX)) {
          sessionStorage.removeItem(key)
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('🗑️ All session tokens cleared')
      }
    } catch (error) {
      console.error('Failed to clear all tokens:', error)
    }
  }

  /**
   * Get all stored room IDs
   */
  static getAllRoomIds(): string[] {
    try {
      const roomIds: string[] = []
      
      // Check localStorage
      const localKeys = Object.keys(localStorage)
      for (const key of localKeys) {
        if (key.startsWith(this.KEY_PREFIX)) {
          const roomId = key.substring(this.KEY_PREFIX.length)
          roomIds.push(roomId)
        }
      }
      
      return roomIds
    } catch (error) {
      console.error('Failed to get room IDs:', error)
      return []
    }
  }

  /**
   * Check if token exists for room
   */
  static hasToken(roomId: string): boolean {
    return this.getToken(roomId) !== null
  }

  /**
   * Get storage key for room
   */
  private static getKey(roomId: string): string {
    return `${this.KEY_PREFIX}${roomId}`
  }

  /**
   * Clean up expired tokens
   */
  static cleanupExpiredTokens(): void {
    try {
      const roomIds = this.getAllRoomIds()
      
      for (const roomId of roomIds) {
        const token = this.getToken(roomId)
        if (!token) {
          // Token was expired and already removed by getToken
          continue
        }
      }
      
      if (import.meta.env.DEV) {
        console.log('🧹 Expired tokens cleaned up')
      }
    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error)
    }
  }
}

// Clean up expired tokens on module load
if (typeof window !== 'undefined') {
  SessionTokenManager.cleanupExpiredTokens()
}
