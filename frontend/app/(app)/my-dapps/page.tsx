"use client";

import { useState } from "react";
import { useUserDApps } from "../../hooks/useUserDApps";
import { useAccount } from "wagmi";
import { Activity, Users, TrendingUp, ExternalLink, Package, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useContractAnalytics } from "../../hooks/useContractAnalytics";

function DAppAnalyticsCard({ dApp }: { dApp: any }) {
  // For now, we'll show analytics for the first contract address
  const firstContract = dApp.contractAddresses[0];
  const { analytics, isLoading, isDataStreamsConnected } = useContractAnalytics(firstContract);
  const router = useRouter();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimeAgo = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="rounded-xl border border-light-gray bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900 hover:border-bright-cyan transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-h3 font-bold text-charcoal dark:text-white">
              {dApp.name}
            </h3>
            <span className="px-2 py-1 rounded-full bg-bright-cyan/20 text-bright-cyan text-caption font-medium">
              {dApp.category}
            </span>
            {isDataStreamsConnected && (
              <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-caption font-medium flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                Live
              </span>
            )}
          </div>
          <p className="text-caption text-slate-gray dark:text-gray-400 mt-1">
            ID: {dApp.id} • {dApp.contractAddresses.length} contract{dApp.contractAddresses.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${dApp.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      {/* Stats Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-bright-cyan" />
        </div>
      ) : analytics ? (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <Activity className="h-5 w-5 text-bright-cyan mx-auto mb-1" />
            <p className="text-h4 font-bold text-charcoal dark:text-white">
              {analytics.totalTransactions}
            </p>
            <p className="text-caption text-slate-gray dark:text-gray-400">
              Transactions
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <Users className="h-5 w-5 text-electric-teal mx-auto mb-1" />
            <p className="text-h4 font-bold text-charcoal dark:text-white">
              {analytics.uniqueUsers}
            </p>
            <p className="text-caption text-slate-gray dark:text-gray-400">
              Users
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <TrendingUp className="h-5 w-5 text-deep-ocean-blue mx-auto mb-1" />
            <p className="text-h4 font-bold text-charcoal dark:text-white">
              {parseFloat(analytics.totalValue).toFixed(2)}
            </p>
            <p className="text-caption text-slate-gray dark:text-gray-400">
              STT Volume
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-slate-gray dark:text-gray-400">
          No activity in recent blocks
        </div>
      )}

      {/* Contract Addresses */}
      <div className="space-y-2 mb-4">
        <p className="text-caption font-medium text-slate-gray dark:text-gray-400">
          Contract Addresses:
        </p>
        {dApp.contractAddresses.map((addr: string, index: number) => (
          <div key={index} className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
            <span className="text-body-small font-mono text-charcoal dark:text-white">
              {formatAddress(addr)}
            </span>
            <a
              href={`https://explorer.somnia.network/address/${addr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bright-cyan hover:text-deep-ocean-blue transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ))}
      </div>

      {/* Activity Info */}
      {analytics?.lastActivity && (
        <p className="text-caption text-slate-gray dark:text-gray-400 mb-4">
          Last activity: {formatTimeAgo(analytics.lastActivity)}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/explore?address=${firstContract}`)}
          className="flex-1 px-4 py-2 bg-bright-cyan text-charcoal font-semibold rounded-lg hover:shadow transition-all"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default function MyDAppsPage() {
  const { isConnected } = useAccount();
  const { dApps, isLoading, error } = useUserDApps();
  const router = useRouter();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="mb-4 h-16 w-16 text-slate-gray dark:text-gray-700" />
        <h3 className="text-h3 font-bold text-charcoal dark:text-white mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-body text-slate-gray dark:text-gray-400 max-w-md">
          Please connect your wallet to view your registered DApps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-bold text-charcoal dark:text-white">
          My DApps
        </h1>
        <p className="text-body mt-2 text-slate-gray dark:text-gray-400">
          Monitor analytics for all your registered applications
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-bright-cyan/30 bg-bright-cyan/10 p-4 dark:border-bright-cyan/50 dark:bg-bright-cyan/20">
        <p className="text-body-small text-deep-ocean-blue dark:text-bright-cyan">
          💡 Analytics are updated in real-time using Somnia Data Streams. All contract activity is tracked automatically.
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-bright-cyan" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
          <h3 className="text-h4 font-semibold text-red-600 dark:text-red-400">
            Error Loading DApps
          </h3>
          <p className="text-body-small mt-2 text-red-600/80 dark:text-red-400/80">
            {error.message}
          </p>
        </div>
      )}

      {/* DApps Grid */}
      {!isLoading && !error && dApps.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dApps.map((dApp) => (
            <DAppAnalyticsCard key={dApp.id} dApp={dApp} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && dApps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="mb-4 h-16 w-16 text-slate-gray dark:text-gray-700" />
          <h3 className="text-h3 font-bold text-charcoal dark:text-white mb-2">
            No DApps Registered
          </h3>
          <p className="text-body text-slate-gray dark:text-gray-400 max-w-md mb-6">
            You haven't registered any DApps yet. Register your first DApp to start tracking analytics.
          </p>
          <button
            onClick={() => router.push("/register")}
            className="px-6 py-3 bg-bright-cyan text-charcoal font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Register Your First DApp
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {!isLoading && dApps.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="/register"
            className="group relative overflow-hidden rounded-xl border border-bright-cyan/40 bg-bright-cyan p-6 text-charcoal transition-transform hover:scale-105"
          >
            <div className="relative z-10">
              <h3 className="text-h3 font-bold">Register Another DApp</h3>
              <p className="text-body mt-2">
                Add more applications to track their analytics
              </p>
            </div>
          </a>

          <a
            href="/explore"
            className="group relative overflow-hidden rounded-xl border border-deep-ocean-blue/30 bg-deep-ocean-blue p-6 text-white transition-transform hover:scale-105"
          >
            <div className="relative z-10">
              <h3 className="text-h3 font-bold">Explore Contracts</h3>
              <p className="text-body mt-2">
                View analytics for any contract on Somnia
              </p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}
