import { useEffect, useState, useCallback } from 'react';
import { getWebSocketUrl } from '../utils/config';

interface UseWebSocketOptions {
  roomId: string | null;
  onMessage?: () => void;
}

export function useWebSocket({ roomId, onMessage }: UseWebSocketOptions) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setWs(null);
      setIsConnected(false);
      return;
    }

    try {
      const wsUrl = getWebSocketUrl(roomId);
      const socket = new WebSocket(wsUrl);
      setWs(socket);

      socket.onopen = () => setIsConnected(true);
      socket.onclose = () => {
        setIsConnected(false);
        setWs(null);
      };
      socket.onmessage = () => {
        if (onMessage) onMessage();
      };
      socket.onerror = () => setIsConnected(false);

      return () => {
        try {
          socket.close();
        } catch {
          /* noop */
        }
      };
    } catch {
      /* noop */
    }
  }, [roomId, onMessage]);

  const send = useCallback((data: any) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
      } catch {
        /* noop */
      }
    }
  }, [ws]);

  return { ws, isConnected, send };
}

