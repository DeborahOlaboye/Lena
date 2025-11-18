"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useReown } from "@reown/appkit";
import { Button } from "./ui/button";
import { LogOut, Wallet } from "lucide-react";

export function WalletConnectButton() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useReown();

  if (!isConnected) {
    return (
      <Button onClick={openConnectModal} className="gap-2">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    );
  }

  const shortenedAddress = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <div className="flex items-center gap-2">
      <div className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-100 dark:bg-gray-800">
        {shortenedAddress}
      </div>
      <Button variant="outline" size="icon" onClick={() => disconnect()}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
