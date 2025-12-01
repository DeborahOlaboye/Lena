'use client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, sepolia } from 'viem/chains';
import { somniaNetwork } from '../config/contracts';

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

// 2. Create wagmiConfig
const metadata = {
  name: 'Lena Analytics',
  description: 'Real-time analytics platform for DApps built on Somnia blockchain',
  url: 'https://lena-analytics.vercel.app',
  icons: ['/logo.png']
};

const chains = [somniaNetwork, mainnet, sepolia];
const wagmiConfig = defaultWagmiConfig({ 
  chains, 
  projectId, 
  metadata,
  enableEmail: true,
});

// 3. Create modal
export const { mount: mountWeb3Modal } = createWeb3Modal({
  wagmiConfig,
  projectId,
  chains,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#4F46E5',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#4F46E5',
  },
  featuredWalletIds: [],
  enableAnalytics: true,
  enableOnramp: true,
});

// 4. Export the config
export { wagmiConfig };
