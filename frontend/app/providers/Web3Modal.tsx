'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { somniaNetwork } from '../config/contracts';

// Get projectId from environment variables
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

// Create metadata object
const metadata = {
  name: 'Lena Analytics',
  description: 'Real-time analytics platform for DApps built on Somnia blockchain',
  url: 'https://lena-analytics.vercel.app',
  icons: ['/logo.svg']
};

// Create wagmiConfig
const wagmiConfig = defaultWagmiConfig({
  chains: [somniaNetwork],
  projectId,
  metadata,
  enableEmail: true,
});

// Create modal
export const web3modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#4F46E5',
  },
});

export { Web3Modal } from '@web3modal/wagmi/react';
