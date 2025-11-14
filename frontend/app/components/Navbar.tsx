"use client";

import { useEffect, useState } from "react";
import { DataStreamsStatus } from "./DataStreamsStatus";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-900">
            <img src="/logo.svg" alt="Lena Logo" className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Lena</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Real-Time DApp Insights
            </p>
          </div>
        </div>

        {/* Network Info & Wallet */}
        <div className="flex items-center gap-4">
          {/* Data Streams Status */}
          <DataStreamsStatus />

          {/* Network Badge */}
          <div className="hidden items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm dark:bg-blue-900/30 sm:flex">
            <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            <span className="font-medium text-blue-700 dark:text-blue-300">
              Somnia Testnet
            </span>
          </div>

          {/* RainbowKit Wallet Connection */}
          {mounted && <ConnectButton />}
        </div>
      </div>
    </nav>
  );
}
