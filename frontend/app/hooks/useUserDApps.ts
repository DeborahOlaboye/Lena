"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContractsSafe } from "./useContractsSafe";
import { DAppInfo } from "../types";

export function useUserDApps() {
  const { address, isConnected } = useAccount();
  const { analyticsRegistry, isReady } = useContractsSafe();
  const [dApps, setDApps] = useState<Array<DAppInfo & { id: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchUserDApps() {
      if (!analyticsRegistry || !isReady || !isConnected || !address) {
        setIsLoading(false);
        setDApps([]);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Fetching DApps for address:", address);

        // Get DApp IDs owned by this address
        const dAppIds = await analyticsRegistry.getDAppsByOwner(address);
        console.log("User's DApp IDs:", dAppIds);

        if (dAppIds.length === 0) {
          console.log("No DApps found for this user");
          setDApps([]);
          setError(null);
          setIsLoading(false);
          return;
        }

        // Fetch details for each DApp
        const dAppDetails = await Promise.all(
          dAppIds.map(async (id: bigint) => {
            const info = await analyticsRegistry.getDAppInfo(id);
            return {
              id: Number(id),
              owner: info.owner,
              name: info.name,
              category: info.category,
              contractAddresses: info.contractAddresses,
              isActive: info.isActive,
              registeredAt: info.registeredAt,
            };
          })
        );

        console.log("Fetched DApp details:", dAppDetails);
        setDApps(dAppDetails);
        setError(null);
      } catch (err) {
        console.error("Error fetching user DApps:", err);
        setError(err as Error);
        setDApps([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserDApps();
  }, [analyticsRegistry, isReady, isConnected, address]);

  return { dApps, isLoading, error };
}
