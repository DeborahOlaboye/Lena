"use client";

import { ethers } from "ethers";
import { useAccount, useWalletClient } from "wagmi";
import { CONTRACTS } from "../config/contracts";
import {
  AnalyticsRegistryABI,
  EventLoggerABI,
  SessionManagerABI,
  MetricsAggregatorABI,
  SimpleSwapABI,
} from "../config/abis";
import { useMemo, useEffect, useState, useCallback } from "react";

/**
 * Safe contract hook with better error handling
 * Returns null if wallet not connected instead of throwing errors
 */
export function useContractsSafe() {
  const { data: walletClient } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [isReady, setIsReady] = useState(false);

  const provider = useMemo(() => {
    if (!walletClient || !isConnected) return null;
    try {
      return new ethers.BrowserProvider(walletClient as any);
    } catch (error) {
      console.error("Error creating provider:", error);
      return null;
    }
  }, [walletClient, isConnected]);

  const getSigner = useCallback(async () => {
    console.log("getSigner called - isConnected:", isConnected, "address:", address, "walletClient:", !!walletClient);

    if (!isConnected || !address) {
      console.log("Cannot get signer: wallet not connected");
      return null;
    }

    if (!walletClient) {
      console.log("Cannot get signer: walletClient not available yet");
      return null;
    }

    try {
      // Create provider directly from walletClient
      const browserProvider = new ethers.BrowserProvider(walletClient as any);
      const signerInstance = await browserProvider.getSigner();
      const signerAddress = await signerInstance.getAddress();
      console.log("Signer obtained successfully:", signerAddress);
      return signerInstance;
    } catch (err) {
      console.error("Error getting signer:", err);
      return null;
    }
  }, [isConnected, address, walletClient]);

  // Read-only contracts (work without wallet connection)
  const analyticsRegistry = useMemo(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
      return new ethers.Contract(
        CONTRACTS.AnalyticsRegistry,
        AnalyticsRegistryABI,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating AnalyticsRegistry contract:", error);
      return null;
    }
  }, []);

  const eventLogger = useMemo(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
      return new ethers.Contract(
        CONTRACTS.EventLogger,
        EventLoggerABI,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating EventLogger contract:", error);
      return null;
    }
  }, []);

  const sessionManager = useMemo(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
      return new ethers.Contract(
        CONTRACTS.SessionManager,
        SessionManagerABI,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating SessionManager contract:", error);
      return null;
    }
  }, []);

  const metricsAggregator = useMemo(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
      return new ethers.Contract(
        CONTRACTS.MetricsAggregator,
        MetricsAggregatorABI,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating MetricsAggregator contract:", error);
      return null;
    }
  }, []);

  const simpleSwap = useMemo(() => {
    try {
      const rpcProvider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
      return new ethers.Contract(
        CONTRACTS.SimpleSwap,
        SimpleSwapABI,
        rpcProvider
      );
    } catch (error) {
      console.error("Error creating SimpleSwap contract:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Mark as ready once contracts are initialized
    if (analyticsRegistry && eventLogger && sessionManager && metricsAggregator && simpleSwap) {
      setIsReady(true);
    }
  }, [analyticsRegistry, eventLogger, sessionManager, metricsAggregator, simpleSwap]);

  return {
    provider,
    getSigner,
    address,
    isConnected,
    isReady,
    analyticsRegistry,
    eventLogger,
    sessionManager,
    metricsAggregator,
    simpleSwap,
  };
}
