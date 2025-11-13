"use client";

import { BarChart, LineChart, Users, TrendingUp, Activity } from "lucide-react";
import { useMetrics } from "../../hooks/useMetrics";
import { formatNumber, calculateSuccessRate, formatPercentage } from "../../lib/utils";
import { MetricCard } from "../../components/MetricCard";

export default function AnalyticsPage() {
  const { metrics, isLoading } = useMetrics();

  const successRate = metrics
    ? calculateSuccessRate(metrics.successfulTransactions, metrics.totalTransactions)
    : 0;

  const failureRate = 100 - successRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytics Overview
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Comprehensive insights and performance metrics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Users"
          value={metrics ? formatNumber(metrics.uniqueUsers) : "0"}
          icon={Users}
          color="blue"
          subtitle="Unique addresses"
          loading={isLoading}
        />
        <MetricCard
          title="Total Transactions"
          value={metrics ? formatNumber(metrics.totalTransactions) : "0"}
          icon={Activity}
          color="green"
          subtitle="All time"
          loading={isLoading}
        />
        <MetricCard
          title="Success Rate"
          value={formatPercentage(successRate)}
          icon={TrendingUp}
          color="purple"
          subtitle="Transaction success"
          loading={isLoading}
        />
        <MetricCard
          title="Gas Used"
          value={metrics ? formatNumber(metrics.totalGasUsed) : "0"}
          icon={BarChart}
          color="orange"
          subtitle="Total gas"
          loading={isLoading}
        />
      </div>

      {/* Transaction Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction Breakdown
          </h2>
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Successful</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {metrics ? formatNumber(metrics.successfulTransactions) : "0"}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Failed</span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {metrics ? formatNumber(metrics.failedTransactions) : "0"}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${failureRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Metrics
          </h2>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Active Users
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {metrics ? formatNumber(metrics.activeUsers) : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Average Gas/Tx
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {metrics && Number(metrics.totalTransactions) > 0
                  ? formatNumber(Number(metrics.totalGasUsed) / Number(metrics.totalTransactions))
                  : "0"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Unique Users
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {metrics ? formatNumber(metrics.uniqueUsers) : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300">
          Performance Insights
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-300">
          {successRate >= 95 && (
            <li>✓ Excellent transaction success rate ({formatPercentage(successRate)})</li>
          )}
          {successRate < 95 && (
            <li>⚠ Transaction success rate could be improved ({formatPercentage(successRate)})</li>
          )}
          {metrics && Number(metrics.activeUsers) > 0 && (
            <li>✓ Currently have {formatNumber(metrics.activeUsers)} active users</li>
          )}
          {metrics && Number(metrics.totalTransactions) > 100 && (
            <li>✓ Great engagement with {formatNumber(metrics.totalTransactions)} total transactions</li>
          )}
        </ul>
      </div>
    </div>
  );
}
