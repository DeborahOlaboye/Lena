/**
 * Somnia Data Streams Service
 * Provides real-time blockchain event streaming using Somnia Data Streams SDK
 */

import { SDK } from '@somnia-chain/streams';
import { CONTRACTS, SOMNIA_RPC_URL, SOMNIA_CHAIN_ID } from '../config/contracts';

interface Subscription {
  id: string;
  unsubscribe: () => void;
}

interface DataStreamsConfig {
  rpcUrl: string;
  chainId: number;
  contracts: typeof CONTRACTS;
  reconnectInterval?: number;
  maxAttempts?: number;
  bufferSize?: number;
}

class DataStreamsService {
  private sdk: any;
  private subscriptions: Map<string, Subscription>;
  private config: DataStreamsConfig;
  private isInitialized: boolean;
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;

  constructor() {
    this.config = {
      rpcUrl: SOMNIA_RPC_URL,
      chainId: SOMNIA_CHAIN_ID,
      contracts: CONTRACTS,
      reconnectInterval: 5000,
      maxAttempts: 10,
      bufferSize: 100,
    };
    this.subscriptions = new Map();
    this.isInitialized = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = this.config.maxAttempts || 10;
  }

  /**
   * Initialize the Data Streams SDK
   */
  async initialize(): Promise<void> {
    try {
      // Initialize SDK with viem client
      const { createPublicClient, http } = await import('viem');

      const client = createPublicClient({
        chain: {
          id: this.config.chainId,
          name: 'Somnia Testnet',
          network: 'somnia',
          nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
          rpcUrls: {
            default: { http: [this.config.rpcUrl] },
            public: { http: [this.config.rpcUrl] },
          },
        } as any,
        transport: http(this.config.rpcUrl),
      });

      this.sdk = new SDK(client as any);

      this.isInitialized = true;
      this.reconnectAttempts = 0;
      console.log('✓ Somnia Data Streams initialized');
    } catch (error) {
      console.error('Failed to initialize Data Streams:', error);
      this.handleReconnect();
      throw error;
    }
  }

  /**
   * Subscribe to EventLogger events from a specific DApp
   */
  async subscribeToEvents(
    dAppId: number,
    callback: (event: any) => void
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const subscription = await this.sdk.streams.subscribe(
        'EventLogged',
        [dAppId],
        (event: any) => {
          callback(event);
        }
      );

      const subscriptionId = `events_${dAppId}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        unsubscribe: () => subscription.unsubscribe(),
      });

      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to events:', error);
      throw error;
    }
  }

  /**
   * Subscribe to all transaction events for a contract
   */
  async subscribeToTransactions(
    contractAddress: string,
    callback: (transaction: any) => void
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const subscription = await this.sdk.streams.subscribe(
        'Transaction',
        [contractAddress],
        (tx: any) => {
          callback(tx);
        }
      );

      const subscriptionId = `transactions_${contractAddress}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        unsubscribe: () => subscription.unsubscribe(),
      });

      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to transactions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to specific contract events
   */
  async subscribeToContractEvents(
    contractAddress: string,
    eventName: string,
    callback: (event: any) => void
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const subscription = await this.sdk.streams.subscribe(
        eventName,
        [contractAddress],
        (event: any) => {
          callback(event);
        }
      );

      const subscriptionId = `contract_events_${contractAddress}_${eventName}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        unsubscribe: () => subscription.unsubscribe(),
      });

      return subscriptionId;
    } catch (error) {
      console.error(`Failed to subscribe to ${eventName}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to user activity across all DApps
   */
  async subscribeToUserActivity(
    userAddress: string,
    callback: (activity: any) => void
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const subscription = await this.sdk.streams.subscribe(
        'UserActivity',
        [userAddress],
        (activity: any) => {
          callback(activity);
        }
      );

      const subscriptionId = `user_activity_${userAddress}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        unsubscribe: () => subscription.unsubscribe(),
      });

      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to user activity:', error);
      throw error;
    }
  }

  /**
   * Subscribe to metrics updates
   */
  async subscribeToMetrics(
    callback: (metrics: any) => void
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const subscription = await this.sdk.streams.subscribe(
        'MetricsUpdated',
        [],
        (metrics: any) => {
          callback(metrics);
        }
      );

      const subscriptionId = `metrics_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        unsubscribe: () => subscription.unsubscribe(),
      });

      return subscriptionId;
    } catch (error) {
      console.error('Failed to subscribe to metrics:', error);
      throw error;
    }
  }

  /**
   * Subscribe to swap events from SimpleSwap
   */
  async subscribeToSwaps(
    callback: (swap: any) => void
  ): Promise<string> {
    return this.subscribeToContractEvents(
      CONTRACTS.SimpleSwap,
      'Swap',
      callback
    );
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`✓ Unsubscribed from ${subscriptionId}`);
    }
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
    console.log('✓ Unsubscribed from all Data Streams');
  }

  /**
   * Get historical events (for initial load)
   */
  async getHistoricalEvents(
    dAppId: number,
    limit: number = 50
  ): Promise<any[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Query historical data using the SDK
      const events = await this.sdk.streams.query('EventLogged', {
        dAppId,
        limit,
        orderBy: 'timestamp',
        order: 'desc',
      });

      return events;
    } catch (error) {
      console.error('Failed to get historical events:', error);
      return [];
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    isConnected: boolean;
    isInitialized: boolean;
    activeSubscriptions: number;
    reconnectAttempts: number;
  } {
    return {
      isConnected: this.isInitialized && this.sdk !== null,
      isInitialized: this.isInitialized,
      activeSubscriptions: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Manual reconnection
   */
  async reconnect(): Promise<void> {
    console.log('🔄 Attempting to reconnect to Data Streams...');
    this.isInitialized = false;
    this.unsubscribeAll();
    await this.initialize();
  }

  /**
   * Handle automatic reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30000
    );

    this.reconnectAttempts++;

    console.log(
      `⏳ Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.reconnect().catch(() => {
        this.handleReconnect();
      });
    }, delay);
  }

  /**
   * Cleanup and disconnect
   */
  disconnect(): void {
    this.unsubscribeAll();
    this.isInitialized = false;
    this.sdk = null;
    console.log('✓ Disconnected from Data Streams');
  }
}

// Export singleton instance
export const dataStreamsService = new DataStreamsService();
