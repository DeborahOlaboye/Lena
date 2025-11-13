"use client";

import { useDataStreamsStatus } from "../hooks/useDataStreams";
import { Activity, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";

export function DataStreamsStatus() {
  const status = useDataStreamsStatus();

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors",
        status.isConnected
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
      )}
      title={`Data Streams ${status.isConnected ? "Connected" : "Disconnected"} | ${status.activeSubscriptions} active subscriptions`}
    >
      {status.isConnected ? (
        <>
          <Wifi className="h-4 w-4 animate-pulse" />
          <span className="hidden font-medium sm:inline">
            Data Streams Live
          </span>
          {status.activeSubscriptions > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white dark:bg-green-500">
              {status.activeSubscriptions}
            </span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span className="hidden font-medium sm:inline">
            {status.reconnectAttempts > 0
              ? `Reconnecting (${status.reconnectAttempts})`
              : "Disconnected"}
          </span>
        </>
      )}
    </div>
  );
}

export function DataStreamsIndicator() {
  const status = useDataStreamsStatus();

  if (!status.isConnected) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-green-500 opacity-75" />
      </div>
      <span className="text-sm font-medium text-green-600 dark:text-green-400">
        Real-Time via Data Streams
      </span>
      <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
    </div>
  );
}

export function DataStreamsBanner() {
  const status = useDataStreamsStatus();

  if (status.isConnected && status.activeSubscriptions > 0) {
    return (
      <div className="animate-fade-in rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-4 dark:border-green-900 dark:from-green-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <Wifi className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 dark:text-green-300">
              Somnia Data Streams Active
            </h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Receiving real-time updates with {"<"}1s latency via {status.activeSubscriptions}{" "}
              active stream{status.activeSubscriptions !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!status.isConnected || status.reconnectAttempts > 0) {
    return (
      <div className="animate-fade-in rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:border-yellow-900 dark:from-yellow-900/20 dark:to-orange-900/20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-300">
              Connecting to Data Streams...
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {status.reconnectAttempts > 0
                ? `Reconnection attempt ${status.reconnectAttempts}`
                : "Initializing real-time connection"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
