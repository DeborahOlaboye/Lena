"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { somniaNetwork } from "../config/contracts";
import { Toaster } from "react-hot-toast";
import { AppKit } from "@reown/appkit";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

// Create wagmi config
const config = createConfig({
  chains: [somniaNetwork as any],
  transports: {
    [somniaNetwork.id]: http(somniaNetwork.rpcUrls.default.http[0]),
  },
});

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Create Reown AppKit config
const appKitConfig = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  metadata: {
    name: "Somnia Analytics",
    description: "Somnia Analytics Dashboard",
    url: "https://somnia.xyz",
    icons: ["https://somnia.xyz/icon.png"],
  },
};

export function ReownProvider({ children }: { children: React.ReactNode }) {
  const wagmiAdapter = new WagmiAdapter({
    networks: [somniaNetwork as any],
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  });
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AppKit
          config={appKitConfig}
          adapter={wagmiAdapter}
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#333",
                color: "#fff",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
            }}
          />
  </AppKit>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
