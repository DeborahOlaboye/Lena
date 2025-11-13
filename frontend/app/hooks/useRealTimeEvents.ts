"use client";

import { useState, useEffect, useCallback } from "react";
import { useContractsSafe } from "./useContractsSafe";
import { AnalyticsEvent } from "../types";
import { ethers } from "ethers";
import { dataStreamsService } from "../services/dataStreamsService";

export function useRealTimeEvents(dAppId?: number, limit: number = 50) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { eventLogger, isReady } = useContractsSafe();

  const loadEvents = useCallback(async () => {
    if (!eventLogger || !isReady) {
      console.log("loadEvents: eventLogger or isReady not available", { eventLogger: !!eventLogger, isReady });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Fetching event IDs for dAppId:", dAppId || 0, "limit:", limit);

      // First, get the event IDs
      const eventIdsResult = await eventLogger.getEventsByDApp(dAppId || 0, limit);
      // Convert Result to array to avoid read-only issues
      const eventIds = Array.from(eventIdsResult) as bigint[];
      console.log("Fetched event IDs:", eventIds.length, "IDs", eventIds);

      if (eventIds.length === 0) {
        console.log("No events found");
        setEvents([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      console.log("Fetching full event details for", eventIds.length, "events");
      // Then, get the full event details - convert bigint[] to regular number[] or keep as bigint[]
      const allEvents = await eventLogger.getEvents(eventIds);
      console.log("Fetched events:", allEvents.length, "events");
      if (allEvents.length > 0) {
        console.log("First event:", allEvents[0]);
      }
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

  // Subscribe to real-time events using both contract events and Data Streams
  useEffect(() => {
    if (!eventLogger || !isReady) {
      setIsLoading(false);
      return;
    }

    loadEvents();

    let subscriptionId: string | null = null;

    // Setup Data Streams subscription for real-time updates
    const setupDataStreams = async () => {
      try {
        console.log('🔄 Setting up Data Streams subscription for dAppId:', dAppId);
        subscriptionId = await dataStreamsService.subscribeToEvents(
          dAppId || 1,
          (newEventData) => {
            console.log('📡 Real-time event received from Data Streams:', newEventData);
            // Reload all events when new one arrives
            loadEvents();
          }
        );
        console.log('✓ Data Streams subscription active:', subscriptionId);
      } catch (err) {
        console.warn('Data Streams subscription failed, falling back to polling:', err);
      }
    };

    setupDataStreams();

    // Also listen for contract events as fallback
    try {
      const filter = eventLogger.filters.EventLogged();
      eventLogger.on(filter, (eventId, dAppIdFromEvent, user, eventType, timestamp) => {
        console.log('📝 Contract event detected, reloading events');
        loadEvents(); // Reload events when new one arrives
      });
    } catch (err) {
      console.error("Error setting up event listener:", err);
    }

    return () => {
      // Cleanup contract listeners
      try {
        eventLogger.removeAllListeners();
      } catch (err) {
        console.error("Error removing listeners:", err);
      }

      // Cleanup Data Streams subscription
      if (subscriptionId) {
        dataStreamsService.unsubscribe(subscriptionId);
      }
    };
  }, [eventLogger, isReady, loadEvents, dAppId]);

  return {
    events,
    isLoading,
    error,
    refresh: loadEvents,
  };
}
