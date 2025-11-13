"use client";

import { Activity, Users, TrendingUp, Zap } from "lucide-react";
import { MetricCard } from "../../components/MetricCard";
import { useMetrics } from "../../hooks/useMetrics";
import { useRealTimeEvents } from "../../hooks/useRealTimeEvents";
import { formatNumber, formatTimeAgo, calculateSuccessRate, formatAddress } from "../../lib/utils";
import { SIMPLE_SWAP_DAPP_ID } from "../../config/contracts";

export default function DashboardPage() {
  const { metrics, isLoading: metricsLoading } = useMetrics();
  const { events, isLoading: eventsLoading } = useRealTimeEvents(SIMPLE_SWAP_DAPP_ID, 20);

  const successRate = metrics
    ? calculateSuccessRate(metrics.successfulTransactions, metrics.totalTransactions)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics Dashboard
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Real-time insights powered by Somnia blockchain
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Users"
          value={metrics ? formatNumber(metrics.activeUsers) : "0"}
          icon={Users}
          color="blue"
          subtitle="Currently active"
          loading={metricsLoading}
        />
        <MetricCard
          title="Total Transactions"
          value={metrics ? formatNumber(metrics.totalTransactions) : "0"}
          icon={Activity}
          color="green"
          subtitle="All time"
          loading={metricsLoading}
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="purple"
          subtitle="Transaction success"
          trend={successRate >= 95 ? "up" : successRate >= 90 ? "neutral" : "down"}
          loading={metricsLoading}
        />
        <MetricCard
          title="Gas Used"
          value={metrics ? formatNumber(metrics.totalGasUsed) : "0"}
          icon={Zap}
          color="orange"
          subtitle="Total gas consumed"
          loading={metricsLoading}
        />
      </div>

      {/* Real-Time Activity Feed */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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

        {/* Event List */}
        <div className="space-y-2">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="mb-2 h-12 w-12 text-gray-300 dark:text-gray-700" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No events yet. Try using the demo swap!
              </p>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.eventId.toString()}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {event.eventType.replace(/_/g, " ").charAt(0).toUpperCase() + event.eventType.replace(/_/g, " ").slice(1)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {formatAddress(event.user)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatTimeAgo(Number(event.timestamp))}
                  </p>
                  <p className="text-xs text-gray-500">
                    Block #{event.blockNumber.toString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <a
          href="/swap"
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-500 to-purple-600 p-6 transition-transform hover:scale-105 dark:border-gray-800"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white">Try Demo Swap</h3>
            <p className="mt-2 text-blue-100">
              Experience real-time analytics with our demo DEX
            </p>
          </div>
          <div className="absolute bottom-0 right-0 -mb-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </a>

        <a
          href="/register"
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-green-500 to-teal-600 p-6 transition-transform hover:scale-105 dark:border-gray-800"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white">Register Your DApp</h3>
            <p className="mt-2 text-green-100">
              Get started with analytics for your application
            </p>
          </div>
          <div className="absolute bottom-0 right-0 -mb-8 -mr-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </a>
      </div>
    </div>
  );
}
