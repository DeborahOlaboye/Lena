"use client";

import { useState, useEffect, useCallback } from "react";
import { useContractsSafe } from "./useContractsSafe";
import { DailyMetrics } from "../types";
import { dataStreamsService } from "../services/dataStreamsService";
import { useRealTimeEvents } from "./useRealTimeEvents";
import { SIMPLE_SWAP_DAPP_ID } from "../config/contracts";

export function useMetrics() {
  const [metrics, setMetrics] = useState<DailyMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get events from Data Streams
  const { events, isLoading: eventsLoading } = useRealTimeEvents(SIMPLE_SWAP_DAPP_ID, 1000);

  // Calculate metrics from events in real-time
  useEffect(() => {
    if (eventsLoading) {
      setIsLoading(true);
      return;
    }

    console.log('📊 Calculating metrics from', events.length, 'events');

    try {
      // Calculate metrics from events
      const uniqueUsersSet = new Set<string>();
      let totalTx = 0;
      let successfulTx = 0;

      events.forEach((event) => {
        uniqueUsersSet.add(event.user.toLowerCase());
        totalTx++;
        successfulTx++; // Assume all logged events are successful
      });

      const calculatedMetrics: DailyMetrics = {
        date: BigInt(Math.floor(Date.now() / 1000 / 86400) * 86400), // Today's timestamp
        activeUsers: BigInt(uniqueUsersSet.size),
        totalTransactions: BigInt(totalTx),
        successfulTransactions: BigInt(successfulTx),
        failedTransactions: BigInt(0),
        totalGasUsed: BigInt(0), // Would need gas data from events
        uniqueUsers: BigInt(uniqueUsersSet.size),
      };

      console.log('✅ Calculated metrics:', {
        activeUsers: calculatedMetrics.activeUsers.toString(),
        totalTransactions: calculatedMetrics.totalTransactions.toString(),
        uniqueUsers: calculatedMetrics.uniqueUsers.toString(),
      });

      setMetrics(calculatedMetrics);
      setError(null);
      setIsLoading(false);
    } catch (err) {
      console.error("Error calculating metrics:", err);
      setError(err as Error);
      setIsLoading(false);
    }
  }, [events, eventsLoading]);

  const refresh = useCallback(() => {
    // Metrics will auto-refresh when events update
    console.log('Metrics refresh triggered (auto-updates with events)');
  }, []);

  return {
    metrics,
    isLoading,
    error,
    refresh,
  };
}
