"use client";

import { useState, useEffect, useCallback } from "react";
import { useContractsSafe } from "./useContractsSafe";
import { DailyMetrics } from "../types";

export function useMetrics() {
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { metricsAggregator, isReady } = useContractsSafe();

  const loadMetrics = useCallback(async () => {
    if (!metricsAggregator || !isReady) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const currentMetrics = await metricsAggregator.getCurrentMetrics();
      setMetrics(currentMetrics);
      setError(null);
    } catch (err) {
      console.error("Error loading metrics:", err);
      setError(err as Error);
      // Set default metrics on error
      setMetrics({
        date: BigInt(0),
        activeUsers: BigInt(0),
        totalTransactions: BigInt(0),
        successfulTransactions: BigInt(0),
        failedTransactions: BigInt(0),
        totalGasUsed: BigInt(0),
        uniqueUsers: BigInt(0),
      });
    } finally {
      setIsLoading(false);
    }
  }, [metricsAggregator, isReady]);

  useEffect(() => {
    if (!metricsAggregator || !isReady) {
      setIsLoading(false);
      return;
    }

    loadMetrics();

    // Listen for metrics updates
    try {
      const filter = metricsAggregator.filters.MetricsUpdated();
      metricsAggregator.on(filter, () => {
        loadMetrics();
      });
    } catch (err) {
      console.error("Error setting up metrics listener:", err);
    }

    // Refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);

    return () => {
      try {
        metricsAggregator.removeAllListeners();
      } catch (err) {
        console.error("Error removing listeners:", err);
      }
      clearInterval(interval);
    };
  }, [metricsAggregator, isReady, loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    refresh: loadMetrics,
  };
}
