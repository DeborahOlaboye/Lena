"use client";

import { useRealTimeEvents } from "../../hooks/useRealTimeEvents";
import { SIMPLE_SWAP_DAPP_ID } from "../../config/contracts";
import { RealTimeMetrics } from "../../components/RealTimeMetrics";
import { RealTimeActivityFeed } from "../../components/RealTimeActivityFeed";

export default function DashboardPage() {
  const { events, isLoading: eventsLoading, error: eventsError } = useRealTimeEvents(SIMPLE_SWAP_DAPP_ID, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Real-Time Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Live insights and metrics powered by Somnia blockchain
        </p>
      </div>

      {/* Real-Time Metrics */}
      <RealTimeMetrics 
        events={events} 
        isLoading={eventsLoading} 
        error={eventsError} 
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <RealTimeActivityFeed 
            events={events}
            isLoading={eventsLoading}
            error={eventsError}
            maxItems={10}
          />
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>
            <div className="space-y-4">
              <a
                href="/swap"
                className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-blue-500"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Try Demo Swap</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Experience our DEX
                    </p>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>

              <a
                href="/register"
                className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-green-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-green-500"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Register DApp</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get analytics for your app
                    </p>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>

              <a
                href="/docs"
                className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-purple-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-800 dark:hover:border-purple-500"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Documentation</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Learn how to integrate
                    </p>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </a>
            </div>
          </div>

          {/* System Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Blockchain Node
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data Streams
                </span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <span className="mr-1 h-2 w-2 rounded-full bg-green-500"></span>
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Response
                </span>
                <span className="text-xs font-medium">
                  <span className="text-green-600 dark:text-green-400">
                    {eventsLoading ? 'Loading...' : `${events.length} events`}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
