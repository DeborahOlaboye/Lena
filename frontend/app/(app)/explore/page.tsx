"use client";

import { useState } from "react";
import { Search, Activity, Users, TrendingUp, Clock, Code, ExternalLink } from "lucide-react";
import { useContractAnalytics } from "../../hooks/useContractAnalytics";
import { MetricCard } from "../../components/MetricCard";
import { ethers } from "ethers";

// Known Somnia contracts for quick access
const KNOWN_CONTRACTS = [
  {
    name: "SimpleSwap (Demo DEX)",
    address: "0x90C9Ba758F7A904CedC63a3DC54E867F09999999",
    category: "DeFi"
  },
  {
    name: "Analytics Registry",
    address: "0xEe4053bf95aA57F5C3cBF0a2d4D54E867F08f044",
    category: "Infrastructure"
  },
  {
    name: "Event Logger",
    address: "0xd233292e91E6d1621cf0DB5e17f9AE4e5d0E9999",
    category: "Infrastructure"
  },
];

export default function ExplorePage() {
  const [inputAddress, setInputAddress] = useState("");
  const [searchAddress, setSearchAddress] = useState<string | undefined>();
  const { analytics, isLoading, error, isDataStreamsConnected } = useContractAnalytics(searchAddress);

  const handleSearch = () => {
    if (ethers.isAddress(inputAddress)) {
      setSearchAddress(inputAddress);
    }
  };

  const handleQuickSelect = (address: string) => {
    setInputAddress(address);
    setSearchAddress(address);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Unknown";
    return new Date(timestamp * 1000).toLocaleString();
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-bold text-charcoal dark:text-white">
          Explore Contracts
        </h1>
        <p className="text-body mt-2 text-slate-gray dark:text-gray-400">
          Track analytics for any smart contract on Somnia blockchain
        </p>
      </div>

      {/* Search Bar */}
      <div className="rounded-xl border border-light-gray bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <label className="block text-body-small font-medium text-charcoal dark:text-gray-300 mb-3">
          Contract Address
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputAddress}
            onChange={(e) => setInputAddress(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 rounded-lg border border-light-gray px-4 py-3 outline-none focus:border-bright-cyan focus:ring-2 focus:ring-bright-cyan/20 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-bright-cyan/30 font-mono"
            placeholder="0x..."
          />
          <button
            onClick={handleSearch}
            disabled={!ethers.isAddress(inputAddress)}
            className="px-6 py-3 bg-bright-cyan text-charcoal font-semibold rounded-lg hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="h-5 w-5" />
            Search
          </button>
        </div>
      </div>

      {/* Quick Access */}
      <div className="rounded-xl border border-light-gray bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-h4 font-semibold text-charcoal dark:text-white mb-4">
          Quick Access - Known Contracts
        </h3>
        <div className="grid gap-3 md:grid-cols-3">
          {KNOWN_CONTRACTS.map((contract) => (
            <button
              key={contract.address}
              onClick={() => handleQuickSelect(contract.address)}
              className="text-left p-4 rounded-lg border border-light-gray hover:border-bright-cyan hover:bg-bright-cyan/5 transition-all dark:border-gray-700 dark:hover:border-bright-cyan"
            >
              <div className="text-body-small font-semibold text-charcoal dark:text-white">
                {contract.name}
              </div>
              <div className="text-caption text-slate-gray dark:text-gray-400 mt-1 font-mono">
                {formatAddress(contract.address)}
              </div>
              <div className="text-caption text-bright-cyan mt-1">
                {contract.category}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-bright-cyan border-t-transparent" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-error/30 bg-error/10 p-6 dark:border-error/50 dark:bg-error/20">
          <h3 className="text-h4 font-semibold text-error">
            Error Loading Contract
          </h3>
          <p className="text-body-small mt-2 text-error/80">
            {error.message}
          </p>
        </div>
      )}

      {/* Analytics Results */}
      {analytics && !isLoading && (
        <>
          {/* Contract Info Banner */}
          <div className="rounded-xl border border-bright-cyan/30 bg-bright-cyan/10 p-6 dark:border-bright-cyan/50 dark:bg-bright-cyan/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-h3 font-bold text-deep-ocean-blue dark:text-bright-cyan">
                    Contract Analytics
                  </h3>
                  {analytics.isContract && (
                    <span className="px-3 py-1 rounded-full bg-electric-teal/20 text-electric-teal text-caption font-medium">
                      <Code className="inline h-3 w-3 mr-1" />
                      Smart Contract
                    </span>
                  )}
                  {isDataStreamsConnected && (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 dark:text-green-400 text-caption font-medium flex items-center gap-1">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                      Live (Data Streams)
                    </span>
                  )}
                </div>
                <p className="text-body-small mt-2 text-deep-ocean-blue dark:text-bright-cyan font-mono">
                  {analytics.contractAddress}
                </p>
                <div className="flex items-center gap-4 mt-3 text-caption text-ocean-blue dark:text-electric-teal">
                  <span>
                    <Clock className="inline h-3 w-3 mr-1" />
                    First seen: {formatTimestamp(analytics.firstSeen)}
                  </span>
                  <span>
                    Last activity: {formatTimeAgo(analytics.lastActivity)}
                  </span>
                </div>
              </div>
              <a
                href={`https://explorer.somnia.network/address/${analytics.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-deep-ocean-blue/10 hover:bg-deep-ocean-blue/20 text-deep-ocean-blue dark:text-bright-cyan transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-body-small">View on Explorer</span>
              </a>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total Transactions"
              value={analytics.totalTransactions.toString()}
              icon={Activity}
              color="cyan"
              subtitle="All time"
            />
            <MetricCard
              title="Unique Users"
              value={analytics.uniqueUsers.toString()}
              icon={Users}
              color="teal"
              subtitle="Interacted with contract"
            />
            <MetricCard
              title="Total Value"
              value={`${parseFloat(analytics.totalValue).toFixed(4)} STT`}
              icon={TrendingUp}
              color="ocean"
              subtitle="Transferred through contract"
            />
          </div>

          {/* Recent Transactions */}
          <div className="rounded-xl border border-light-gray bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-h2 font-bold text-charcoal dark:text-white">
                  Recent Transactions
                </h2>
                <p className="text-body-small text-slate-gray dark:text-gray-400">
                  Latest activity on this contract
                </p>
              </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-2">
              {analytics.recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="mb-2 h-12 w-12 text-slate-gray dark:text-gray-700" />
                  <p className="text-body-small text-slate-gray dark:text-gray-400">
                    No transactions found in recent blocks
                  </p>
                </div>
              ) : (
                analytics.recentTransactions.map((tx, index) => (
                  <div
                    key={tx.hash}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bright-cyan/10 dark:bg-bright-cyan/20">
                        <Activity className="h-5 w-5 text-bright-cyan" />
                      </div>
                      <div>
                        <p className="text-body font-medium text-charcoal dark:text-white font-mono">
                          {formatAddress(tx.hash)}
                        </p>
                        <p className="text-body-small text-slate-gray dark:text-gray-400">
                          from {formatAddress(tx.from)} → {formatAddress(tx.to)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-body-small font-medium text-charcoal dark:text-white">
                        {parseFloat(tx.value).toFixed(4)} STT
                      </p>
                      <p className="text-caption text-slate-gray dark:text-gray-400">
                        Block #{tx.blockNumber}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!searchAddress && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 h-16 w-16 text-slate-gray dark:text-gray-700" />
          <h3 className="text-h3 font-bold text-charcoal dark:text-white mb-2">
            Explore Any Contract
          </h3>
          <p className="text-body text-slate-gray dark:text-gray-400 max-w-md">
            Enter any contract address to view real-time analytics, transaction history,
            and user interactions on the Somnia blockchain.
          </p>
        </div>
      )}
    </div>
  );
}
