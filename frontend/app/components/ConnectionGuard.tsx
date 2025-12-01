"use client";

import { useAccount } from 'wagmi';
import { ConnectButton } from '@reown/appkit-wagmi';

export function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();

  if (isConnected) return <>{children}</>;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto mb-3 h-10 w-10">
          <img src="/logo.svg" alt="Lena" className="h-10 w-10" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connect your wallet</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Please connect to access this page.
        </p>
        <div className="mt-5 flex justify-center">
          <ConnectButton
            theme="dark"
            style={{
              backgroundColor: '#4F46E5',
              color: 'white',
              borderRadius: '8px',
              padding: '8px 16px',
              fontWeight: 500,
            }}
          />
        </div>
      </div>
    </div>
  );
}
