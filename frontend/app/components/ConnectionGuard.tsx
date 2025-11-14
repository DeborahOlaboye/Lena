"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { usePathname, useRouter } from "next/navigation";

export function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If not connected and we're in a protected area (any route under (app)), redirect to Home
    if (!isConnected) {
      // Avoid redirect loops if already on Home
      if (pathname !== "/") {
        router.replace("/");
      }
    }
  }, [isConnected, pathname, router]);

  return <>{children}</>;
}
