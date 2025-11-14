"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { dataStreamsService } from "../services/dataStreamsService";

export interface ContractTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  gasUsed?: string;
  status?: number;
}

export interface ContractAnalytics {
  contractAddress: string;
  totalTransactions: number;
  uniqueUsers: number;
  totalValue: string;
  recentTransactions: ContractTransaction[];
  firstSeen?: number;
  lastActivity?: number;
  isContract: boolean;
  contractCode?: string;
}

/**
 * Hook to fetch analytics for ANY contract address on Somnia
 * Uses Data Streams for real-time updates + blockchain scanning for historical data
 */
export function useContractAnalytics(contractAddress?: string) {
  const [analytics, setAnalytics] = useState<ContractAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDataStreamsConnected, setIsDataStreamsConnected] = useState(false);

  const fetchContractAnalytics = useCallback(async (address: string) => {
    if (!address || !ethers.isAddress(address)) {
      setError(new Error("Invalid contract address"));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log("📊 Fetching analytics for contract:", address);

      // Create provider for Somnia network
      const provider = new ethers.JsonRpcProvider("https://dream-rpc.somnia.network");

      // Check if address is a contract
      const code = await provider.getCode(address);
      const isContract = code !== "0x";

      console.log("Is contract:", isContract);

      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      console.log("Current block:", currentBlock);

      // Fetch recent blocks to analyze transactions
      // Somnia has very high TPS, so we'll look at recent blocks
      const blocksToScan = 1000; // Scan last 1000 blocks
      const fromBlock = Math.max(0, currentBlock - blocksToScan);

      console.log(`Scanning blocks ${fromBlock} to ${currentBlock}`);

      const uniqueUsersSet = new Set<string>();
      const transactions: ContractTransaction[] = [];
      let totalValue = BigInt(0);
      let firstSeen: number | undefined;
      let lastActivity: number | undefined;

      // Fetch transactions involving this address
      // We'll scan recent blocks for efficiency
      const blockPromises: Promise<any>[] = [];

      // Sample blocks (every 10th block for efficiency)
      const sampleInterval = Math.max(1, Math.floor(blocksToScan / 100));

      for (let i = fromBlock; i <= currentBlock; i += sampleInterval) {
        blockPromises.push(provider.getBlock(i, true));
      }

      const blocks = await Promise.all(blockPromises);

      for (const block of blocks) {
        if (!block || !block.transactions) continue;

        for (const tx of block.transactions) {
          if (typeof tx === 'string') continue;

          // Check if transaction involves our contract
          const txFrom = tx.from?.toLowerCase();
          const txTo = tx.to?.toLowerCase();
          const targetAddr = address.toLowerCase();

          if (txFrom === targetAddr || txTo === targetAddr) {
            const txData: ContractTransaction = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to || "",
              value: ethers.formatEther(tx.value || 0),
              blockNumber: block.number,
              timestamp: block.timestamp,
            };

            transactions.push(txData);

            // Track unique users (addresses that interacted with the contract)
            if (txFrom === targetAddr && txTo) {
              uniqueUsersSet.add(txTo);
            } else if (txTo === targetAddr) {
              uniqueUsersSet.add(txFrom);
            }

            totalValue += BigInt(tx.value || 0);

            // Track first and last activity
            if (!firstSeen || block.timestamp < firstSeen) {
              firstSeen = block.timestamp;
            }
            if (!lastActivity || block.timestamp > lastActivity) {
              lastActivity = block.timestamp;
            }
          }
        }
      }

      // Sort transactions by block number (most recent first)
      transactions.sort((a, b) => b.blockNumber - a.blockNumber);

      const analyticsData: ContractAnalytics = {
        contractAddress: address,
        totalTransactions: transactions.length,
        uniqueUsers: uniqueUsersSet.size,
        totalValue: ethers.formatEther(totalValue),
        recentTransactions: transactions.slice(0, 50), // Keep last 50
        firstSeen,
        lastActivity,
        isContract,
        contractCode: isContract ? code : undefined,
      };

      console.log("✅ Analytics fetched:", {
        totalTx: analyticsData.totalTransactions,
        uniqueUsers: analyticsData.uniqueUsers,
        totalValue: analyticsData.totalValue,
      });

      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      console.error("Error fetching contract analytics:", err);
      setError(err as Error);
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to real-time updates via Data Streams
  useEffect(() => {
    if (!contractAddress || !ethers.isAddress(contractAddress)) {
      return;
    }

    // Initial fetch
    fetchContractAnalytics(contractAddress);

    let subscriptionId: string | null = null;

    const setupDataStreamsSubscription = async () => {
      try {
        console.log("📡 Setting up Data Streams for contract:", contractAddress);
        await dataStreamsService.initialize();

        // Subscribe to transactions for this contract
        subscriptionId = await dataStreamsService.subscribeToTransactions(
          contractAddress,
          (newTx) => {
            console.log("📡 New transaction via Data Streams:", newTx);
            // Update analytics with new transaction
            if (analytics) {
              const newTransaction: ContractTransaction = {
                hash: newTx.hash || "0x",
                from: newTx.from || "",
                to: newTx.to || "",
                value: ethers.formatEther(newTx.value || 0),
                blockNumber: newTx.blockNumber || 0,
                timestamp: Math.floor(Date.now() / 1000),
              };

              setAnalytics((prev) => {
                if (!prev) return prev;

                const updatedTxs = [newTransaction, ...prev.recentTransactions].slice(0, 50);
                const uniqueUsers = new Set(updatedTxs.map(tx => tx.from));

                return {
                  ...prev,
                  totalTransactions: prev.totalTransactions + 1,
                  uniqueUsers: uniqueUsers.size,
                  recentTransactions: updatedTxs,
                  lastActivity: newTransaction.timestamp,
                };
              });
            } else {
              // If no analytics yet, refresh to get all data
              fetchContractAnalytics(contractAddress);
            }
          }
        );

        setIsDataStreamsConnected(true);
        console.log("✅ Data Streams subscription active for contract:", contractAddress);
      } catch (err) {
        console.warn("⚠️ Data Streams subscription failed, polling only:", err);
        setIsDataStreamsConnected(false);
      }
    };

    setupDataStreamsSubscription();

    // Cleanup
    return () => {
      if (subscriptionId) {
        dataStreamsService.unsubscribe(subscriptionId);
        console.log("✅ Unsubscribed from Data Streams for contract:", contractAddress);
      }
    };
  }, [contractAddress, fetchContractAnalytics, analytics]);

  return {
    analytics,
    isLoading,
    error,
    isDataStreamsConnected,
    refresh: () => contractAddress && fetchContractAnalytics(contractAddress),
  };
}
