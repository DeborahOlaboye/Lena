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
import { useMemo } from "react";

export function useContracts() {
  const { data: walletClient } = useWalletClient();
  const { address } = useAccount();

  const provider = useMemo(() => {
    if (!walletClient) return null;
    return new ethers.BrowserProvider(walletClient as any);
  }, [walletClient]);

  const signer = useMemo(async () => {
    if (!provider) return null;
    return await provider.getSigner();
  }, [provider]);

  const analyticsRegistry = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(
      CONTRACTS.AnalyticsRegistry,
      AnalyticsRegistryABI,
      provider
    );
  }, [provider]);

  const eventLogger = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(
      CONTRACTS.EventLogger,
      EventLoggerABI,
      provider
    );
  }, [provider]);

  const sessionManager = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(
      CONTRACTS.SessionManager,
      SessionManagerABI,
      provider
    );
  }, [provider]);

  const metricsAggregator = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(
      CONTRACTS.MetricsAggregator,
      MetricsAggregatorABI,
      provider
    );
  }, [provider]);

  const simpleSwap = useMemo(() => {
    if (!provider) return null;
    return new ethers.Contract(
      CONTRACTS.SimpleSwap,
      SimpleSwapABI,
      provider
    );
  }, [provider]);

  return {
    provider,
    signer,
    address,
    analyticsRegistry,
    eventLogger,
    sessionManager,
    metricsAggregator,
    simpleSwap,
  };
}
