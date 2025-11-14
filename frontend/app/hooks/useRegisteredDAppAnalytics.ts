"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserDApps } from "./useUserDApps";
import { dataStreamsService } from "../services/dataStreamsService";
import { ethers } from "ethers";
import { ContractTransaction } from "./useContractAnalytics";

export interface AggregatedDAppAnalytics {
  dAppId: number;
  dAppName: string;
  totalTransactions: number;
  uniqueUsers: number;
  totalValue: string;
  contractAddresses: string[];
  recentTransactions: ContractTransaction[];
  lastActivity?: number;
}

/**
 * Hook to fetch analytics for a registered DApp
 * Aggregates data from all contract addresses and uses Data Streams for real-time updates
 */
export function useRegisteredDAppAnalytics(dAppId?: number) {
  const { dApps, isLoading: dAppsLoading } = useUserDApps();
  const [analytics, setAnalytics] = useState<AggregatedDAppAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);

  const selectedDApp = dApps.find((d) => d.id === dAppId);

  // Fetch analytics for all contract addresses in the selected DApp
  const fetchAggregatedAnalytics = useCallback(async () => {
    if (!selectedDApp || selectedDApp.contractAddresses.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("📊 Fetching aggregated analytics for DApp:", selectedDApp.name);
      console.log("Contract addresses:", selectedDApp.contractAddresses);

      const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");
      const currentBlock = await provider.getBlockNumber();
      const blocksToScan = 1000;
      const fromBlock = Math.max(0, currentBlock - blocksToScan);

      // Aggregate data from all contracts
      const uniqueUsersSet = new Set<string>();
      const allTransactions: ContractTransaction[] = [];
      let totalValue = BigInt(0);
      let lastActivity: number | undefined;

      // Scan blocks for all contract addresses
      const sampleInterval = Math.max(1, Math.floor(blocksToScan / 100));
      const blockPromises: Promise<any>[] = [];

      for (let i = fromBlock; i <= currentBlock; i += sampleInterval) {
        blockPromises.push(provider.getBlock(i, true));
      }

      const blocks = await Promise.all(blockPromises);

      for (const block of blocks) {
        if (!block || !block.transactions) continue;

        for (const tx of block.transactions) {
          if (typeof tx === 'string') continue;

          // Check if transaction involves any of our contracts
          const txFrom = tx.from?.toLowerCase();
          const txTo = tx.to?.toLowerCase();

          const involvesOurContract = selectedDApp.contractAddresses.some(
            (addr) => addr.toLowerCase() === txFrom || addr.toLowerCase() === txTo
          );

          if (involvesOurContract) {
            const txData: ContractTransaction = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to || "",
              value: ethers.formatEther(tx.value || 0),
              blockNumber: block.number,
              timestamp: block.timestamp,
            };

            allTransactions.push(txData);
            uniqueUsersSet.add(txFrom);
            if (txTo) uniqueUsersSet.add(txTo);
            totalValue += BigInt(tx.value || 0);

            if (!lastActivity || block.timestamp > lastActivity) {
              lastActivity = block.timestamp;
            }
          }
        }
      }

      // Sort transactions by block number (most recent first)
      allTransactions.sort((a, b) => b.blockNumber - a.blockNumber);

      const aggregated: AggregatedDAppAnalytics = {
        dAppId: selectedDApp.id,
        dAppName: selectedDApp.name,
        totalTransactions: allTransactions.length,
        uniqueUsers: uniqueUsersSet.size,
        totalValue: ethers.formatEther(totalValue),
        contractAddresses: selectedDApp.contractAddresses,
        recentTransactions: allTransactions.slice(0, 50),
        lastActivity,
      };

      console.log("✅ Aggregated analytics:", {
        totalTx: aggregated.totalTransactions,
        uniqueUsers: aggregated.uniqueUsers,
        contracts: aggregated.contractAddresses.length,
      });

      setAnalytics(aggregated);
      setError(null);
    } catch (err) {
      console.error("Error fetching aggregated analytics:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDApp]);

  // Set up Data Streams subscriptions for all contract addresses
  useEffect(() => {
    if (!selectedDApp || selectedDApp.contractAddresses.length === 0) {
      setIsLoading(false);
      return;
    }

    fetchAggregatedAnalytics();

    const setupSubscriptions = async () => {
      try {
        await dataStreamsService.initialize();

        const subIds: string[] = [];

        // Subscribe to each contract address
        for (const contractAddress of selectedDApp.contractAddresses) {
          try {
            const subId = await dataStreamsService.subscribeToTransactions(
              contractAddress,
              (newTx) => {
                console.log("📡 New transaction for DApp contract:", contractAddress, newTx);

                // Update analytics with new transaction
                setAnalytics((prev) => {
                  if (!prev) return prev;

                  const newTransaction: ContractTransaction = {
                    hash: newTx.hash || "0x",
                    from: newTx.from || "",
                    to: newTx.to || "",
                    value: ethers.formatEther(newTx.value || 0),
                    blockNumber: newTx.blockNumber || 0,
                    timestamp: Math.floor(Date.now() / 1000),
                  };

                  const updatedTxs = [newTransaction, ...prev.recentTransactions].slice(0, 50);
                  const uniqueUsers = new Set(updatedTxs.flatMap(tx => [tx.from, tx.to]));

                  return {
                    ...prev,
                    totalTransactions: prev.totalTransactions + 1,
                    uniqueUsers: uniqueUsers.size,
                    recentTransactions: updatedTxs,
                    lastActivity: newTransaction.timestamp,
                  };
                });
              }
            );

            subIds.push(subId);
          } catch (err) {
            console.warn(`Failed to subscribe to ${contractAddress}:`, err);
          }
        }

        setSubscriptions(subIds);
        console.log(`✅ Subscribed to ${subIds.length} contracts for DApp ${selectedDApp.name}`);
      } catch (err) {
        console.warn("⚠️ Failed to set up Data Streams subscriptions:", err);
      }
    };

    setupSubscriptions();

    // Cleanup
    return () => {
      subscriptions.forEach((subId) => {
        dataStreamsService.unsubscribe(subId);
      });
      console.log("✅ Cleaned up Data Streams subscriptions for DApp");
    };
  }, [selectedDApp, fetchAggregatedAnalytics]);

  return {
    analytics,
    isLoading: isLoading || dAppsLoading,
    error,
    refresh: fetchAggregatedAnalytics,
  };
}
