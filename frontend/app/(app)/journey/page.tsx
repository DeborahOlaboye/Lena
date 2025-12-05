"use client";

import { useState } from "react";
import { Users, TrendingUp, Clock, Activity, Search } from "lucide-react";
import { useAccount } from "wagmi";
import { useRealTimeEvents } from "../../hooks/useRealTimeEvents";
import { formatAddress, formatTimeAgo } from "../../lib/utils";
import { SIMPLE_SWAP_DAPP_ID } from "../../config/contracts";
import { EnhancedTimeline } from "../../components/EnhancedTimeline";
import { UserJourneyFlow } from "../../components/UserJourneyFlow";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            User Journey
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Track and visualize user interactions and flows
          </p>
        </div>
        
        {/* Search */}
        <div className="w-96">
          <label htmlFor="search" className="sr-only">Search user address</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="search"
              type="text"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="block w-full rounded-lg border-0 bg-white py-2 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:bg-gray-800 dark:text-white dark:ring-gray-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6"
              placeholder="Search by wallet address..."
            />
          </div>
        </div>
      </div>

      {/* User Journey Visualization */}
      {searchAddress ? (
        <div className="space-y-8">
          {/* Flow Diagram */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              User Flow
            </h2>
            <div className="h-96 rounded-lg border border-gray-200 dark:border-gray-700">
              <UserJourneyFlow events={userEvents} />
            </div>
          </div>
          
          {/* Detailed Timeline */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Detailed Timeline for {formatAddress(searchAddress)}
              </h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {userEvents.length} events
              </span>
            </div>
            
            <EnhancedTimeline events={userEvents} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No user selected</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Search for a wallet address to view their journey
          </p>
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
