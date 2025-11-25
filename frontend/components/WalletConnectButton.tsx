"use client";

import { useAccount, useDisconnect } from "wagmi";
import { AppKitConnectButton } from "@reown/appkit/react";
import { LogOut, Wallet } from "lucide-react";

export function WalletConnectButton() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return (
      <AppKitConnectButton className="gap-2 inline-flex items-center px-3 py-2 rounded-md">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </AppKitConnectButton>
    );
  }

  const shortenedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800">
        {shortenedAddress}
      </div>
      <button
        onClick={() => disconnect()}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-gray-200 dark:border-gray-700"
        aria-label="Disconnect"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
