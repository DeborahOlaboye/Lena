"use client";

import { useState } from "react";
import { Users, TrendingUp, Clock, Activity } from "lucide-react";
import { useAccount } from "wagmi";
import { useRealTimeEvents } from "../../hooks/useRealTimeEvents";
import { formatAddress, formatTimeAgo } from "../../lib/utils";
import { SIMPLE_SWAP_DAPP_ID } from "../../config/contracts";

export default function JourneyPage() {
  const { address } = useAccount();
  const [searchAddress, setSearchAddress] = useState(address || "");
  const { events } = useRealTimeEvents(SIMPLE_SWAP_DAPP_ID, 100);

  const userEvents = searchAddress
    ? events.filter((e) => e.user.toLowerCase() === searchAddress.toLowerCase())
    : [];

  const eventsByUser = new Map<string, typeof events>();
  events.forEach((event) => {
    const userAddr = event.user.toLowerCase();
    if (!eventsByUser.has(userAddr)) {
      eventsByUser.set(userAddr, []);
    }
    eventsByUser.get(userAddr)!.push(event);
  });

  const topUsers = Array.from(eventsByUser.entries())
    .map(([addr, userEventsArr]) => ({
      address: addr,
      eventCount: userEventsArr.length,
      lastSeen: Math.max(...userEventsArr.map((e) => Number(e.timestamp))),
    }))
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          User Journey
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Track user behavior and interactions
        </p>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search User Address
        </label>
        <input
          type="text"
          value={searchAddress}
          onChange={(e) => setSearchAddress(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-900"
          placeholder="0x..."
        />
      </div>

      {/* User Journey Timeline */}
      {searchAddress && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Journey Timeline for {formatAddress(searchAddress)}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {userEvents.length} events
          </p>

          {userEvents.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
              <Activity className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No events found for this user
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {userEvents.map((event, index) => (
                <div key={event.eventId.toString()} className="relative">
                  {index < userEvents.length - 1 && (
                    <div className="absolute left-6 top-12 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {event.eventType.replace(/_/g, " ").charAt(0).toUpperCase() +
                             event.eventType.replace(/_/g, " ").slice(1)}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {formatTimeAgo(Number(event.timestamp))}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Block #{event.blockNumber.toString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Users */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Most Active Users
        </h2>
        <div className="mt-6 space-y-2">
          {topUsers.map((user, index) => (
            <div
              key={user.address}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-white">
                  #{index + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatAddress(user.address)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last seen {formatTimeAgo(user.lastSeen)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900 dark:text-white">
                  {user.eventCount}
                </p>
                <p className="text-xs text-gray-500">events</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <Users className="mb-2 h-8 w-8 text-blue-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {eventsByUser.size}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <TrendingUp className="mb-2 h-8 w-8 text-green-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {events.length}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <Clock className="mb-2 h-8 w-8 text-purple-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Avg Events/User</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {eventsByUser.size > 0 ? (events.length / eventsByUser.size).toFixed(1) : "0"}
          </p>
        </div>
      </div>
    </div>
  );
}
