"use client";

import { Activity, Clock, User, CheckCircle, XCircle, Clock as ClockIcon, Zap, ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useMemo } from "react";
import { AnalyticsEvent } from "../types";

type RealTimeActivityFeedProps = {
  events: AnalyticsEvent[];
  isLoading: boolean;
  error: Error | null;
  maxItems?: number;
};

type EventStatus = "success" | "failed" | "pending";

const getEventIcon = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'swap':
      return <ArrowUpDown className="h-4 w-4 text-blue-500" />;
    case 'addliquidity':
    case 'removeliquidity':
      return <Zap className="h-4 w-4 text-purple-500" />;
    default:
      return <Activity className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusFromEvent = (event: AnalyticsEvent): EventStatus => {
  // This is a simplified example - you might want to implement more sophisticated logic
  // based on your application's requirements
  return 'success'; // Default to success for now
};

export function RealTimeActivityFeed({
  events,
  isLoading,
  error,
  maxItems = 10,
}: RealTimeActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevEventsLength = useRef(events.length);

  // Sort events by timestamp in descending order (newest first)
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => 
      Number(a.timestamp) - Number(b.timestamp)
    ).slice(0, maxItems);
  }, [events, maxItems]);

  // Auto-scroll to bottom when new events come in
  useEffect(() => {
    if (events.length > prevEventsLength.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevEventsLength.current = events.length;
  }, [events.length]);

  const formatTimestamp = (timestamp: bigint) => {
    // Convert BigInt timestamp (in seconds) to milliseconds for date-fns
    const date = new Date(Number(timestamp) * 1000);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/_/g, ' ') // Replace underscores with spaces
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Get status based on event type or random for demo
  const getStatus = (eventType: string): "success" | "failed" | "pending" => {
    if (eventType.includes('FAILED')) return 'failed';
    if (eventType.includes('PENDING')) return 'pending';
    return Math.random() > 0.1 ? 'success' : 'failed';
  };

  // Format address to show first and last 4 characters
  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get icon based on event type
  const getEventIcon = (eventType: string) => {
    if (eventType.includes('SWAP')) {
      return (
        <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 17.6V7a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 7v10.6a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z" />
            <path d="M12 22V12" />
            <path d="m3.5 7 8.5 4.8L20.5 7" />
          </svg>
        </div>
      );
    }
    if (eventType.includes('ADD_LIQUIDITY') || eventType.includes('REMOVE_LIQUIDITY')) {
      return (
        <div className="rounded-full bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20" />
            <path d="M2 12h20" />
          </svg>
        </div>
      );
    }
    return (
      <div className="rounded-full bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <Activity className="h-4 w-4" />
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (status: "success" | "failed" | "pending") => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'success':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>
            <CheckCircle className="mr-1 h-3 w-3" /> Success
          </span>
        );
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>
            <XCircle className="mr-1 h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>
            <ClockIcon className="mr-1 h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Live Activity Feed
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time events from your DApps
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Live
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <div
          ref={containerRef}
          className="max-h-[500px] overflow-y-auto p-2"
        >
          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col items-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading activity...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
              <div className="flex items-center gap-3 text-red-700 dark:text-red-300">
                <XCircle className="h-5 w-5" />
                <p>Error loading activity feed: {error.message}</p>
              </div>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
              <Activity className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No activity yet</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Activity will appear here when you start using the application.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {sortedEvents.map((event) => {
                const status = getStatus(event.eventType);
                return (
                  <li key={event.eventId?.toString() || Math.random()}>
                    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex-shrink-0">
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatEventType(event.eventType)}
                          </p>
                          <div className="ml-2 flex-shrink-0">
                            {getStatusBadge(status)}
                          </div>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <User className="mr-1 h-3.5 w-3.5" />
                          <span className="font-mono">
                            {formatAddress(event.user)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(Number(event.timestamp) * 1000), {
                            addSuffix: true,
                          })}
                        </div>
                        <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          Block #{event.blockNumber?.toString() || 'pending'}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
