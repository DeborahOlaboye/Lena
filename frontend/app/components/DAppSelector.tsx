"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Check, Loader2, Plus } from "lucide-react";
import { useSelectedDApp } from "../providers/DAppProvider";
import { useUserDApps } from "../hooks/useUserDApps";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

export function DAppSelector() {
  const { selectedDAppId, setSelectedDAppId } = useSelectedDApp();
  const { dApps, isLoading } = useUserDApps();
  const { isConnected } = useAccount();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".dapp-selector")) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen]);

  if (!mounted || !isConnected) {
    return null;
  }

  const selectedDApp = dApps.find((d) => d.id === selectedDAppId);

  return (
    <div className="dapp-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            ) : selectedDApp ? (
              <>
                {selectedDApp.name}
                <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                  (#{selectedDApp.id})
                </span>
              </>
            ) : (
              "Select DApp"
            )}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Your DApps
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Switch between your registered DApps
            </p>
          </div>

          {/* DApp List */}
          <div className="py-2">
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Loading your DApps...
                </p>
              </div>
            ) : dApps.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  No DApps registered
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Register your first DApp to get started
                </p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/register");
                  }}
                  className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Register DApp
                </button>
              </div>
            ) : (
              <>
                {dApps.map((dapp) => (
                  <button
                    key={dapp.id}
                    onClick={() => {
                      setSelectedDAppId(dapp.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      selectedDAppId === dapp.id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          dapp.isActive ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {dapp.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {dapp.id}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {dapp.category}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedDAppId === dapp.id && (
                      <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </button>
                ))}

                {/* Register New DApp Button */}
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      router.push("/register");
                    }}
                    className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Register New DApp
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
