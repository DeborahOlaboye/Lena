import { useEffect, useRef, useState, useCallback } from 'react';
import WebSocketService from '../services/websocket/WebSocketService';

type WebSocketState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url: string;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useWebSocket({
  url,
  autoReconnect = true,
  maxReconnectAttempts = 5,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketOptions) {
  const [state, setState] = useState<WebSocketState>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const wsService = useRef<WebSocketService | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (wsService.current) {
      wsService.current.disconnect();
    }

    setState('connecting');
    wsService.current = new WebSocketService(url);
    
    const ws = wsService.current;

    ws.on('connect', () => {
      setState('connected');
      setReconnectAttempts(0);
      onConnect?.();
    });

    ws.on('disconnect', () => {
      setState('disconnected');
      onDisconnect?.();
    });

    ws.on('reconnecting', ({ attempt }: { attempt: number }) => {
      setState('connecting');
      setReconnectAttempts(attempt);
    });

    ws.on('message', (data: any) => {
      onMessage?.(data);
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      setState('error');
      onError?.(error);
    });

    return () => {
      if (autoReconnect && reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      ws.disconnect();
    };
  }, [url, autoReconnect, onMessage, onConnect, onDisconnect, onError]);

  // Auto-reconnect logic
  useEffect(() => {
    if (!autoReconnect || state !== 'disconnected' || reconnectAttempts >= maxReconnectAttempts) {
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    
    reconnectTimeout.current = setTimeout(() => {
      if (wsService.current) {
        wsService.current.connect();
      } else {
        connect();
      }
    }, delay);

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [state, reconnectAttempts, autoReconnect, maxReconnectAttempts, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  // Send message through WebSocket
  const send = useCallback((message: any) => {
    if (!wsService.current) {
      console.error('WebSocket is not connected');
      return false;
    }
    return wsService.current.send(message);
  }, []);

  // Manually reconnect
  const reconnect = useCallback(() => {
    if (wsService.current) {
      wsService.current.connect();
    } else {
      connect();
    }
  }, [connect]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (wsService.current) {
      wsService.current.disconnect();
    }
  }, []);

  return {
    state,
    reconnectAttempts,
    send,
    reconnect,
    disconnect,
    isConnected: state === 'connected',
    isConnecting: state === 'connecting',
    isDisconnected: state === 'disconnected',
    hasError: state === 'error',
  };
}

export default useWebSocket;
