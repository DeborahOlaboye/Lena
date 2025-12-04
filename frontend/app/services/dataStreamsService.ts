/**
 * Multi-Chain Data Streams Service
 * Provides real-time blockchain event streaming across multiple chains
 */

import { SDK } from '@somnia-chain/streams';
import { CHAINS, type ChainId } from '../config/chains';
import { getContracts, type ContractAddresses } from '../config/contracts';

export interface ChainConfig {
  id: ChainId;
  rpcUrl: string;
  contracts: ContractAddresses;
}

interface Subscription {
  id: string;
  chainId: number;
  unsubscribe: () => void;
}

interface DataStreamsConfig {
  defaultChainId: number;
  reconnectInterval?: number;
  maxAttempts?: number;
  bufferSize?: number;
}

type ChainSDKInstance = {
  sdk: any;
  isInitialized: boolean;
  reconnectAttempts: number;
};

class DataStreamsService {
  private chainSDKs: Map<number, ChainSDKInstance>;
  private subscriptions: Map<string, Subscription>;
  private config: DataStreamsConfig;
  private activeChainId: number;
  private maxReconnectAttempts: number;

  constructor() {
    this.config = {
      defaultChainId: CHAINS[0]?.id,
      reconnectInterval: 5000,
      maxAttempts: 10,
      bufferSize: 100,
    };
    
    this.chainSDKs = new Map();
    this.subscriptions = new Map();
    this.activeChainId = this.config.defaultChainId;
    this.maxReconnectAttempts = this.config.maxAttempts || 10;
  }

  /**
   * Initialize the Data Streams SDK for a specific chain
   */
  async initialize(chainId: number = this.activeChainId): Promise<boolean> {
    try {
      const chain = CHAINS[chainId as ChainId];
      if (!chain) {
        throw new Error(`Chain with ID ${chainId} is not supported`);
      }

      // Skip if already initialized for this chain
      if (this.chainSDKs.has(chainId)) {
        const instance = this.chainSDKs.get(chainId)!;
        if (instance.isInitialized) {
          return true;
        }
      }

      // Initialize SDK with viem client
      const { createPublicClient, http } = await import('viem');
      const contracts = getContracts(chainId);

      const publicClient = createPublicClient({
        chain: {
          id: chain.id,
          name: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: chain.rpcUrls,
        } as any, // Using any to bypass network property requirement
        transport: http(chain.rpcUrls.default.http[0]),
      });

      // Initialize SDK with public client only (read-only mode)
      const sdk = new SDK({
        public: publicClient as any,
      });

      this.chainSDKs.set(chainId, {
        sdk,
        isInitialized: true,
        reconnectAttempts: 0,
      });

      this.activeChainId = chainId;
      console.log(`✓ Data Streams SDK initialized for ${chain.name} (Chain ID: ${chainId})`);
      return true;
    } catch (error) {
      console.error(`Failed to initialize Data Streams for chain ${chainId}:`, error);
      this.handleReconnect(chainId);
      return false;
    }
  }

  /**
   * Get or create SDK instance for a specific chain
   */
  private async getSDK(chainId: number = this.activeChainId): Promise<any> {
    // Initialize SDK for the chain if not already done
    if (!this.chainSDKs.has(chainId) || !this.chainSDKs.get(chainId)?.isInitialized) {
      const initialized = await this.initialize(chainId);
      if (!initialized) {
        throw new Error(`Failed to initialize SDK for chain ${chainId}`);
      }
    }

    const instance = this.chainSDKs.get(chainId);
    if (!instance?.sdk) {
      throw new Error(`SDK not available for chain ${chainId}`);
    }

    this.activeChainId = chainId;
    return instance.sdk;
  }

  /**
   * Get the active chain ID
   */
  getActiveChainId(): number {
    return this.activeChainId;
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: number): Promise<boolean> {
    if (chainId === this.activeChainId) {
      return true; // Already on this chain
    }

    try {
      await this.initialize(chainId);
      this.activeChainId = chainId;
      return true;
    } catch (error) {
      console.error(`Failed to switch to chain ${chainId}:`, error);
      return false;
    }
  }

  /**
   * Subscribe to EventLogger events from a specific DApp
   */
  async subscribeToEvents(
    dAppId: number,
    callback: (event: any, chainId: number) => void,
    chainId: number = this.activeChainId
  ): Promise<string> {
    const sdk = await this.getSDK(chainId);
    const contracts = getContracts(chainId);

    try {
      const initParams = {
        somniaStreamsEventId: 'EventLogged',
        ethCalls: [
          {
            to: contracts.EventLogger,
            data: '0x',
          }
        ],
        context: `events_dapp_${dAppId}_chain_${chainId}`,
        onData: (data: any) => {
          console.log(`📡 [Chain ${chainId}] New EventLogged event:`, data);
          callback(data, chainId);
        },
        onlyPushChanges: true,
      };

      console.log(`📡 [Chain ${chainId}] Subscribing to events with params:`, initParams);
      const subscription = await sdk.streams.subscribe(initParams);

      if (!subscription || typeof subscription.unsubscribe !== 'function') {
        console.warn(`[Chain ${chainId}] Data Streams subscription returned invalid object, falling back to polling`);
        const dummyId = `events_fallback_${dAppId}_${chainId}_${Date.now()}`;
        this.subscriptions.set(dummyId, {
          id: dummyId,
          chainId,
          unsubscribe: () => {},
        });
        return dummyId;
      }

      const subscriptionId = `events_${dAppId}_${chainId}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        chainId,
        unsubscribe: () => {
          try {
            subscription.unsubscribe();
          } catch (err) {
            console.warn(`[Chain ${chainId}] Error unsubscribing:`, err);
          }
        },
      });

      console.log(`✓ [Chain ${chainId}] Subscribed to EventLogged events for dApp ${dAppId}`);
      return subscriptionId;
    } catch (error) {
      console.error(`[Chain ${chainId}] Failed to subscribe to events:`, error);
      console.warn(`⚠️ [Chain ${chainId}] Data Streams subscription failed, application will fall back to polling`);
      const fallbackId = `events_error_${dAppId}_${chainId}_${Date.now()}`;
      this.subscriptions.set(fallbackId, {
        id: fallbackId,
        chainId,
        unsubscribe: () => {},
      });
      return fallbackId;
    }
  }

  /**
   * Subscribe to all transaction events for a contract
   */
  async subscribeToTransactions(
    contractAddress: string,
    callback: (transaction: any) => void,
    chainId: number = this.activeChainId
  ): Promise<string> {
    const sdk = await this.getSDK(chainId);
    
    try {
      const subscription = await sdk.streams.subscribe(
        'Transaction',
        [contractAddress],
        (tx: any) => {
          callback(tx);
        }
      );

      const subscriptionId = `transactions_${contractAddress}_${chainId}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        chainId,
        unsubscribe: () => {
          try {
            subscription.unsubscribe();
          } catch (err) {
            console.warn(`[Chain ${chainId}] Error unsubscribing from transaction:`, err);
          }
        },
      });

      return subscriptionId;
    } catch (error) {
      console.error(`[Chain ${chainId}] Failed to subscribe to transactions:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to specific contract events
   */
  async subscribeToContractEvents(
    contractAddress: string,
    eventName: string,
    callback: (event: any) => void,
    chainId: number = this.activeChainId
  ): Promise<string> {
    const sdk = await this.getSDK(chainId);
    
    try {
      const subscription = await sdk.streams.subscribe(
        eventName,
        [contractAddress],
        (event: any) => {
          callback(event);
        }
      );

      const subscriptionId = `contract_events_${contractAddress}_${eventName}_${chainId}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        chainId,
        unsubscribe: () => {
          try {
            subscription.unsubscribe();
          } catch (err) {
            console.warn(`[Chain ${chainId}] Error unsubscribing from contract events:`, err);
          }
        },
      });

      return subscriptionId;
    } catch (error) {
      console.error(`[Chain ${chainId}] Failed to subscribe to ${eventName}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to user activity across all DApps
   */
  async subscribeToUserActivity(
    userAddress: string,
    callback: (activity: any) => void,
    chainId: number = this.activeChainId
  ): Promise<string> {
    const sdk = await this.getSDK(chainId);
    
    try {
      const subscription = await sdk.streams.subscribe(
        'UserActivity',
        [userAddress],
        (activity: any) => {
          callback(activity);
        }
      );

      const subscriptionId = `user_activity_${userAddress}_${chainId}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        chainId,
        unsubscribe: () => {
          try {
            subscription.unsubscribe();
          } catch (err) {
            console.warn(`[Chain ${chainId}] Error unsubscribing from user activity:`, err);
          }
        },
      });

      return subscriptionId;
    } catch (error) {
      console.error(`[Chain ${chainId}] Failed to subscribe to user activity:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to metrics updates
   */
  async subscribeToMetrics(
    callback: (metrics: any) => void,
    chainId: number = this.activeChainId
  ): Promise<string> {
    const sdk = await this.getSDK(chainId);
    
    try {
      const subscription = await sdk.streams.subscribe(
        'MetricsUpdated',
        [],
        (metrics: any) => {
          callback(metrics);
        }
      );

      const subscriptionId = `metrics_${chainId}_${Date.now()}`;
      this.subscriptions.set(subscriptionId, {
        id: subscriptionId,
        chainId,
        unsubscribe: () => {
          try {
            subscription.unsubscribe();
          } catch (err) {
            console.warn(`[Chain ${chainId}] Error unsubscribing from metrics:`, err);
          }
        },
      });

      return subscriptionId;
    } catch (error) {
      console.error(`[Chain ${chainId}] Failed to subscribe to metrics:`, error);
      throw error;
    }
  }

  /**
   * Subscribe to swap events from SimpleSwap
   */
  async subscribeToSwaps(
    callback: (swap: any) => void,
    chainId: number = this.activeChainId
  ): Promise<string> {
    const contracts = getContracts(chainId);
    return this.subscribeToContractEvents(
      contracts.SimpleSwap,
      'Swap',
      callback,
      chainId
    );
  }

  /**
   * Unsubscribe from a specific subscription
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription && typeof subscription.unsubscribe === 'function') {
      try {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionId);
        console.log(`✓ [Chain ${subscription.chainId}] Unsubscribed from ${subscriptionId}`);
      } catch (err) {
        console.warn(`[Chain ${subscription.chainId}] Error unsubscribing from ${subscriptionId}:`, err);
        this.subscriptions.delete(subscriptionId);
      }
    }
  }

  /**
   * Unsubscribe from all active subscriptions for a specific chain
   */
  unsubscribeAllForChain(chainId: number): void {
    const toRemove: string[] = [];
    
    this.subscriptions.forEach((sub, id) => {
      if (sub.chainId === chainId) {
        try {
          sub.unsubscribe();
          toRemove.push(id);
        } catch (err) {
          console.warn(`[Chain ${chainId}] Error unsubscribing from ${id}:`, err);
          toRemove.push(id);
        }
      }
    });

    toRemove.forEach(id => this.subscriptions.delete(id));
    console.log(`✓ Unsubscribed from all Data Streams on chain ${chainId}`);
  }

  /**
   * Unsubscribe from all active subscriptions across all chains
   */
  unsubscribeAll(): void {
    // Group subscriptions by chain ID for better logging
    const chains = new Set<number>();
    
    this.subscriptions.forEach((sub) => {
      try {
        sub.unsubscribe();
        chains.add(sub.chainId);
      } catch (err) {
        console.warn(`[Chain ${sub.chainId}] Error unsubscribing:`, err);
      }
    });
    
    this.subscriptions.clear();
    console.log(`✓ Unsubscribed from all Data Streams across chains: ${Array.from(chains).join(', ')}`);
  }

  /**
   * Get historical events (for initial load)
   */
  async getHistoricalEvents(
    dAppId: number,
    limit: number = 50,
    chainId: number = this.activeChainId
  ): Promise<any[]> {
    const sdk = await this.getSDK(chainId);
    
    try {
      // This would be implemented based on your specific requirements
      // and the capabilities of your Data Streams service
      console.log(`[Chain ${chainId}] Fetching last ${limit} events for dApp ${dAppId}`);
      return [];
    } catch (error) {
      console.error(`[Chain ${chainId}] Failed to fetch historical events:`, error);
      throw error;
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
   * Manual reconnection for a specific chain
   */
  async reconnect(chainId: number = this.activeChainId): Promise<boolean> {
    console.log(`🔄 [Chain ${chainId}] Attempting to reconnect to Data Streams...`);
    
    // Clear existing subscriptions for this chain
    this.unsubscribeAllForChain(chainId);
    
    // Reset the SDK instance for this chain
    this.chainSDKs.delete(chainId);
    
    // Reinitialize
    return this.initialize(chainId);
  }

  /**
   * Handle automatic reconnection with exponential backoff for a specific chain
   */
  private handleReconnect(chainId: number): void {
    const instance = this.chainSDKs.get(chainId);
    if (!instance) {
      console.error(`❌ [Chain ${chainId}] No SDK instance found for reconnection`);
      return;
    }

    if (instance.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ [Chain ${chainId}] Max reconnect attempts reached`);
      return;
    }

    const delay = Math.min(
      1000 * Math.pow(2, instance.reconnectAttempts),
      30000
    );

    instance.reconnectAttempts++;

    console.log(
      `⏳ [Chain ${chainId}] Reconnecting in ${delay / 1000}s (attempt ${instance.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.initialize(chainId).catch(() => {
        this.handleReconnect(chainId);
      });
    }, delay);
  }

  /**
   * Cleanup and disconnect from all chains
   */
  disconnect(): void {
    this.unsubscribeAll();
    
    // Clean up all SDK instances
    this.chainSDKs.forEach((instance, chainId) => {
      try {
        // If the SDK has a disconnect method, call it
        if (instance.sdk && typeof instance.sdk.disconnect === 'function') {
          instance.sdk.disconnect();
        }
        instance.isInitialized = false;
        console.log(`✓ Disconnected from Data Streams on chain ${chainId}`);
      } catch (err) {
        console.error(`[Chain ${chainId}] Error during disconnect:`, err);
      }
    });
    
    this.chainSDKs.clear();
    this.activeChainId = this.config.defaultChainId;
    console.log('✓ Disconnected from all Data Streams');
  }

  /**
   * Get the status of the Data Streams service
   */
  getStatus() {
    const status: Record<number, {
      isInitialized: boolean;
      reconnectAttempts: number;
      activeSubscriptions: number;
    }> = {};

    // Add status for each initialized chain
    this.chainSDKs.forEach((instance, chainId) => {
      status[chainId] = {
        isInitialized: instance.isInitialized,
        reconnectAttempts: instance.reconnectAttempts,
        activeSubscriptions: Array.from(this.subscriptions.values())
          .filter(sub => sub.chainId === chainId).length,
      };
    });

    return {
      activeChainId: this.activeChainId,
      chains: status,
      totalSubscriptions: this.subscriptions.size,
    };
  }
}

// Export singleton instance
export const dataStreamsService = new DataStreamsService();
