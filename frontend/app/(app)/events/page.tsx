"use client";

import { useState } from "react";
import { Activity, Filter, RefreshCw } from "lucide-react";
import { useRealTimeEvents } from "../../hooks/useRealTimeEvents";
import { formatAddress, formatTimeAgo } from "../../lib/utils";
import { SIMPLE_SWAP_DAPP_ID } from "../../config/contracts";

export default function EventsPage() {
  const [limit, setLimit] = useState(50);
  const [filter, setFilter] = useState<string>("all");
  const { events, isLoading, refresh } = useRealTimeEvents(SIMPLE_SWAP_DAPP_ID, limit);

  const eventTypes = ["all", "swap", "liquidity_added", "liquidity_removed"];

  const filteredEvents = filter === "all"
    ? events
    : events.filter((e) => e.eventType === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Real-Time Events
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Monitor live activity across your DApps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Live Monitoring
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by type:
          </span>
        </div>
        <div className="flex gap-2">
          {eventTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === type
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {type.replace(/_/g, " ").charAt(0).toUpperCase() + type.replace(/_/g, " ").slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={refresh}
          className="ml-auto flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Events List */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-700" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No events found. Try using the demo swap!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredEvents.map((event) => {
              let eventData;
              try {
                eventData = JSON.parse(event.eventData);
              } catch {
                eventData = {};
              }

              return (
                <div
                  key={event.eventId.toString()}
                  className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <Activity className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {event.eventType.replace(/_/g, " ").charAt(0).toUpperCase() +
                           event.eventType.replace(/_/g, " ").slice(1)}
                        </p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          User: {formatAddress(event.user)}
                        </p>
                        {eventData && Object.keys(eventData).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(eventData).map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              >
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTimeAgo(Number(event.timestamp))}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Block #{event.blockNumber.toString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {events.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">Filtered Events</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {filteredEvents.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-600 dark:text-gray-400">Event Types</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {new Set(events.map((e) => e.eventType)).size}
          </p>
        </div>
      </div>
    </div>
  );
}
