/**
 * Centralized configuration for API and WebSocket URLs
 */

export function getApiBaseUrl(): string {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  return isLocal ? 'http://localhost:8000' : 'https://cassino-game-backend.fly.dev';
}

export function getWebSocketUrl(roomId: string): string {
  // Check for explicit WebSocket URL in environment
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL}/ws/${roomId}`;
  }
  
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  
  if (isLocal) {
    return `ws://localhost:8000/ws/${roomId}`;
  }
  
  // Always use Fly.io backend for production
  return `wss://cassino-game-backend.fly.dev/ws/${roomId}`;
}

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

