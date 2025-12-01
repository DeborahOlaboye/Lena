'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, sepolia } from 'viem/chains';
import { somniaNetwork } from '../config/contracts';

declare global {
  interface Window { 
    ethereum?: any;
  }
}

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

// 2. Create wagmiConfig
const metadata = {
  name: 'Lena Analytics',
  description: 'Real-time analytics platform for DApps built on Somnia blockchain',
  url: 'https://lena-analytics.vercel.app',
  icons: ['/logo.png']
};

// Ensure we have a valid chain configuration
const chains = [somniaNetwork, mainnet, sepolia];

// Create wagmi config
const wagmiConfig = defaultWagmiConfig({ 
  projectId, 
  chains,
  metadata,
  // Remove enableEmail as it's not supported in this version
});

// 3. Create modal
createWeb3Modal({
  wagmiConfig,
  projectId,
  // Remove chains from here as it's not needed
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#4F46E5',
    '--w3m-color-mix-strength': '20',
    '--w3m-accent': '#4F46E5',
  },
  // Remove featuredWalletIds as it's not needed
  enableAnalytics: true,
  enableOnramp: true,
});

// 4. Export the config
export { wagmiConfig };
