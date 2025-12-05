import { EventEmitter } from 'events';

type WebSocketEvent = 'connect' | 'disconnect' | 'message' | 'error' | 'reconnect' | 'reconnecting';

class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  private shouldReconnect: boolean = true;
  private messageQueue: any[] = [];
  private isConnected: boolean = false;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(url: string) {
    super();
    this.url = url;
    this.connect();
  }

  connect() {
    if (this.isConnected) return;

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
      
      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.isConnected) {
          this.handleDisconnect();
        }
      }, 10000); // 10 second connection timeout
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.handleDisconnect();
    }
  }

  private setupEventListeners() {
    if (!this.ws) return;

    this.ws.onopen = () => this.handleConnect();
    this.ws.onclose = () => this.handleDisconnect();
    this.ws.onerror = (error) => this.handleError(error);
    this.ws.onmessage = (event) => this.handleMessage(event);
  }

  private handleConnect() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connect');
    
    // Start ping-pong to keep connection alive
    this.startPingPong();
    
    // Process any queued messages
    this.processMessageQueue();
    
    console.log('WebSocket connected');
  }

  private handleDisconnect() {
    this.isConnected = false;
    this.cleanup();
    
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.calculateReconnectDelay();
      
      console.log(`WebSocket disconnected. Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.emit('reconnecting', { attempt: this.reconnectAttempts });
        this.connect();
      }, delay);
    } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('error', new Error('Max reconnection attempts reached'));
    }
    
    this.emit('disconnect');
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.emit('error', error);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      this.emit('message', data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      this.emit('error', error);
    }
  }

  private calculateReconnectDelay(): number {
    // Exponential backoff with jitter
    const baseDelay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    const jitter = Math.random() * 1000; // Add up to 1 second of jitter
    return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
  }

  private startPingPong() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    
    this.pingInterval = setInterval(() => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, 30000); // Send ping every 30 seconds
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  send(message: any) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // Queue the message if not connected
      this.messageQueue.push(message);
      return false;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws.send(messageString);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      this.emit('error', error);
      return false;
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.cleanup();
  }

  private cleanup() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      
      this.ws = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.isConnected = false;
  }

  on(event: WebSocketEvent, listener: (...args: any[]) => void) {
    super.on(event, listener);
    return this;
  }

  off(event: WebSocketEvent, listener: (...args: any[]) => void) {
    super.off(event, listener);
    return this;
  }
}

export default WebSocketService;
