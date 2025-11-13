"use client";

import { useState, useEffect, useCallback } from "react";
import { dataStreamsService } from "../services/dataStreamsService";
import { AnalyticsEvent } from "../types";
import { SIMPLE_SWAP_DAPP_ID } from "../config/contracts";

/**
 * Hook for real-time events using Somnia Data Streams
 */
export function useDataStreamEvents(dAppId?: number, limit: number = 50) {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const loadInitialEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const historicalEvents = await dataStreamsService.getHistoricalEvents(
        dAppId || SIMPLE_SWAP_DAPP_ID,
        limit
      );
      setEvents(historicalEvents);
      setError(null);
    } catch (err) {
      console.error("Error loading initial events:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [dAppId, limit]);

  useEffect(() => {
    let subId: string | null = null;

    const setupSubscription = async () => {
      try {
        // Initialize Data Streams
        await dataStreamsService.initialize();
        setIsConnected(true);

        // Load historical events first
        await loadInitialEvents();

        // Subscribe to real-time updates
        subId = await dataStreamsService.subscribeToEvents(
          dAppId || SIMPLE_SWAP_DAPP_ID,
          (newEvent) => {
            console.log("📡 New event received via Data Streams:", newEvent);
            setEvents((prev) => [newEvent, ...prev].slice(0, limit));
          }
        );

        setSubscriptionId(subId);
        console.log("✓ Subscribed to Data Streams events");
      } catch (err) {
        console.error("Error setting up Data Streams subscription:", err);
        setError(err as Error);
        setIsConnected(false);
      }
    };

    setupSubscription();

    // Cleanup
    return () => {
      if (subId) {
        dataStreamsService.unsubscribe(subId);
        console.log("✓ Cleaned up Data Streams subscription");
      }
    };
  }, [dAppId, limit, loadInitialEvents]);

  const refresh = useCallback(async () => {
    await loadInitialEvents();
  }, [loadInitialEvents]);

  const status = dataStreamsService.getConnectionStatus();

  return {
    events,
    isLoading,
    isConnected: status.isConnected,
    error,
    refresh,
    connectionStatus: status,
  };
}

/**
 * Hook for real-time metrics using Somnia Data Streams
 */
export function useDataStreamMetrics() {
  const [metrics, setMetrics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let subId: string | null = null;

    const setupSubscription = async () => {
      try {
        await dataStreamsService.initialize();
        setIsConnected(true);

        // Subscribe to metrics updates
        subId = await dataStreamsService.subscribeToMetrics((newMetrics) => {
          console.log("📊 Metrics updated via Data Streams:", newMetrics);
          setMetrics(newMetrics);
          setIsLoading(false);
        });

        console.log("✓ Subscribed to Data Streams metrics");
      } catch (err) {
        console.error("Error setting up metrics subscription:", err);
        setError(err as Error);
        setIsConnected(false);
        setIsLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (subId) {
        dataStreamsService.unsubscribe(subId);
      }
    };
  }, []);

  return {
    metrics,
    isLoading,
    isConnected,
    error,
  };
}

/**
 * Hook for real-time swap events using Somnia Data Streams
 */
export function useDataStreamSwaps() {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let subId: string | null = null;

    const setupSubscription = async () => {
      try {
        await dataStreamsService.initialize();
        setIsConnected(true);

        subId = await dataStreamsService.subscribeToSwaps((swap) => {
          console.log("💱 New swap via Data Streams:", swap);
          setSwaps((prev) => [swap, ...prev].slice(0, 20));
        });

        console.log("✓ Subscribed to Data Streams swaps");
      } catch (err) {
        console.error("Error setting up swap subscription:", err);
        setIsConnected(false);
      }
    };

    setupSubscription();

    return () => {
      if (subId) {
        dataStreamsService.unsubscribe(subId);
      }
    };
  }, []);

  return {
    swaps,
    isConnected,
  };
}

/**
 * Hook for Data Streams connection status
 */
export function useDataStreamsStatus() {
  const [status, setStatus] = useState(dataStreamsService.getConnectionStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(dataStreamsService.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return status;
}
