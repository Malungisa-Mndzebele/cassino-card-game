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
  
  // For production, check if we should use Fly.io backend or proxied WebSocket
  // If on khasinogaming.com, use same origin with /cassino/ws path (proxied)
  // Otherwise, use Fly.io backend directly
  if (host === 'khasinogaming.com' || host.includes('khasinogaming')) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Use relative WebSocket path (proxied by frontend server)
    return `${protocol}//${origin.replace(/^https?:/, '')}/cassino/ws/${roomId}`;
  }
  
  // Always use Fly.io backend for other production environments
  return `wss://cassino-game-backend.fly.dev/ws/${roomId}`;
}

export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

