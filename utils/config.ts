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
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss' : 'ws';
  
  if (isLocal) {
    return `ws://localhost:8000/ws/${roomId}`;
  }
  
  return `wss://cassino-game-backend.fly.dev/ws/${roomId}`;
}

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

