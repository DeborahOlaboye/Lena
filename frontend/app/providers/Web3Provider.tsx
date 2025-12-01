"use client";

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKitProvider, AppKitTheme } from '@reown/appkit';
import { AppKitWagmiProvider } from '@reown/appkit-wagmi';
import { somniaNetwork } from '../config/contracts';
import { Toaster } from 'react-hot-toast';
import { web3modal } from './Web3Modal';

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const theme: AppKitTheme = {
    colors: {
      primary: '#4F46E5',
      background: '#1a1a1a',
      text: '#ffffff',
      card: '#1e1e1e',
      border: '#2d2d2d',
    },
    radii: {
      small: '4px',
      medium: '8px',
      large: '12px',
    },
    space: {
      small: '8px',
      medium: '16px',
      large: '24px',
    },
  };

  return (
    <WagmiProvider config={web3modal.config}>
      <QueryClientProvider client={queryClient}>
        <AppKitProvider theme={theme}>
          <AppKitWagmiProvider>
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
                error: {
                  iconTheme: {
                    primary: "#ef4444",
                    secondary: "#fff",
                  },
                },
              }}
            />
          </AppKitWagmiProvider>
        </AppKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
