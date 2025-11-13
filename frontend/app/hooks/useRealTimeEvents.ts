"use client";

import { useState, useEffect, useCallback } from "react";
import { useContractsSafe } from "./useContractsSafe";
import { AnalyticsEvent } from "../types";
import { ethers } from "ethers";

export function useRealTimeEvents(dAppId?: number, limit: number = 50) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { eventLogger, isReady } = useContractsSafe();

  const loadEvents = useCallback(async () => {
    if (!eventLogger || !isReady) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const allEvents = await eventLogger.getEventsByDApp(dAppId || 0, limit);
      setEvents(allEvents);
      setError(null);
    } catch (err) {
      console.error("Error loading events:", err);
      setError(err as Error);
      setEvents([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [eventLogger, isReady, dAppId, limit]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!eventLogger || !isReady) {
      setIsLoading(false);
      return;
    }

    loadEvents();

    // Listen for new events
    try {
      const filter = eventLogger.filters.EventLogged();
      eventLogger.on(filter, (eventId, dAppIdFromEvent, user, eventType, timestamp) => {
        loadEvents(); // Reload events when new one arrives
      });
    } catch (err) {
      console.error("Error setting up event listener:", err);
    }

    return () => {
      try {
        eventLogger.removeAllListeners();
      } catch (err) {
        console.error("Error removing listeners:", err);
      }
    };
  }, [eventLogger, isReady, loadEvents]);

  return {
    events,
    isLoading,
    error,
    refresh: loadEvents,
  };
}
