"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SIMPLE_SWAP_DAPP_ID } from "../config/contracts";

interface DAppContextType {
  selectedDAppId: number;
  setSelectedDAppId: (id: number) => void;
}

const DAppContext = createContext<DAppContextType | undefined>(undefined);

export function DAppProvider({ children }: { children: ReactNode }) {
  const [selectedDAppId, setSelectedDAppIdState] = useState<number>(SIMPLE_SWAP_DAPP_ID);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("selectedDAppId");
    if (stored) {
      setSelectedDAppIdState(Number(stored));
    }
  }, []);

  // Save to localStorage when changed
  const setSelectedDAppId = (id: number) => {
    setSelectedDAppIdState(id);
    if (mounted) {
      localStorage.setItem("selectedDAppId", id.toString());
    }
  };

  return (
    <DAppContext.Provider value={{ selectedDAppId, setSelectedDAppId }}>
      {children}
    </DAppContext.Provider>
  );
}

export function useSelectedDApp() {
  const context = useContext(DAppContext);
  if (context === undefined) {
    throw new Error("useSelectedDApp must be used within a DAppProvider");
  }
  return context;
}
