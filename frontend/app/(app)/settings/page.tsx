"use client";

import { Settings as SettingsIcon, Network, Code, FileText } from "lucide-react";
import { CONTRACTS, SOMNIA_CHAIN_ID, SOMNIA_RPC_URL } from "../../config/contracts";

export default function SettingsPage() {
  const contractEntries = Object.entries(CONTRACTS);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configuration and contract information
        </p>
      </div>

      {/* Network Info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <Network className="h-6 w-6 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Network Configuration
          </h2>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Network</p>
            <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white">
              Somnia Testnet
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Chain ID</p>
            <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white">
              {SOMNIA_CHAIN_ID}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">RPC URL</p>
            <p className="mt-1 font-mono text-sm font-medium text-gray-900 dark:text-white break-all">
              {SOMNIA_RPC_URL}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Addresses */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-4">
          <Code className="h-6 w-6 text-green-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Smart Contract Addresses
          </h2>
        </div>
        <div className="space-y-4">
          {contractEntries.map(([name, address]) => (
            <div
              key={name}
              className="rounded-lg border border-gray-100 p-4 dark:border-gray-800"
            >
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {name}
              </p>
              <p className="mt-1 font-mono text-sm text-gray-900 dark:text-white break-all">
                {address}
              </p>
              <a
                href={`https://explorer.somnia.network/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                View on Explorer →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Documentation */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-300">
            Need Help?
          </h3>
        </div>
        <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
          Check out our documentation to learn how to integrate Somnia Analytics
          into your DApp and start tracking user behavior in real-time.
        </p>
      </div>
    </div>
  );
}
