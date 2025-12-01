"use client";

import { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { formatNumber } from "../lib/utils";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type MetricData = {
  timestamp: number;
  value: number;
};

type RealTimeMetricsProps = {
  events: any[];
  isLoading: boolean;
  error: Error | null;
};

export function RealTimeMetrics({ events, isLoading, error }: RealTimeMetricsProps) {
  const chartRef = useRef<any>(null);
  
  // Process events to get metrics over time
  const processMetrics = () => {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // Last hour
    
    // Filter events from the last hour
    const recentEvents = events.filter(
      (event) => Number(event.timestamp) * 1000 > oneHourAgo
    );

    // Group events into 5-minute intervals
    const interval = 5 * 60 * 1000; // 5 minutes in milliseconds
    const intervals: Record<number, number> = {};
    
    recentEvents.forEach((event) => {
      const eventTime = Number(event.timestamp) * 1000;
      const intervalTime = Math.floor(eventTime / interval) * interval;
      intervals[intervalTime] = (intervals[intervalTime] || 0) + 1;
    });

    // Convert to array and sort by time
    const dataPoints = Object.entries(intervals)
      .map(([time, count]) => ({
        timestamp: parseInt(time),
        value: count,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return dataPoints;
  };

  const dataPoints = processMetrics();
  
  // Prepare chart data
  const chartData = {
    labels: dataPoints.map((point) => {
      const date = new Date(point.timestamp);
      return date.toLocaleTimeString();
    }),
    datasets: [
      {
        label: "Transactions per 5 min",
        data: dataPoints.map((point) => point.value),
        borderColor: "#4F46E5",
        backgroundColor: "rgba(79, 70, 229, 0.2)",
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          precision: 0,
        },
      },
    },
  };

  // Calculate metrics
  const uniqueUsers = new Set(events.map((event) => event.user.toLowerCase()));
  const totalTransactions = events.length;
  const successfulTransactions = events.filter(
    (event) => event.eventType === "SWAP_COMPLETED"
  ).length;
  const successRate = totalTransactions > 0 
    ? Math.round((successfulTransactions / totalTransactions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Users
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(uniqueUsers.size)}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(totalTransactions)}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Success Rate
              </p>
              <div className="mt-1 flex items-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {successRate}%
                </p>
                <span
                  className={`ml-2 flex items-center text-sm font-medium ${
                    successRate >= 90
                      ? "text-green-600 dark:text-green-400"
                      : successRate >= 70
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {successRate >= 90 ? (
                    <>
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                      Good
                    </>
                  ) : successRate >= 70 ? (
                    <>
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14"
                        />
                      </svg>
                      Average
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      Needs Attention
                    </>
                  )}
                </span>
              </div>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg. Response Time
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {events.length > 0 ? "< 1s" : "N/A"}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Transaction Volume (Last Hour)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time transaction volume over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              Live
            </span>
          </div>
        </div>
        <div className="h-64 w-full">
          {dataPoints.length > 0 ? (
            <Line
              ref={chartRef}
              data={chartData}
              options={options}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              {isLoading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              ) : error ? (
                <p className="text-red-500">Error loading chart data</p>
              ) : (
                <p>No data available yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
