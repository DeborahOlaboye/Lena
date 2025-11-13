"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import { useContractsSafe } from "../../hooks/useContractsSafe";
import { toast } from "react-hot-toast";
import { CategoryType } from "../../types";

const categories: CategoryType[] = ["DeFi", "NFT", "Gaming", "Social", "DAO", "Other"];

export default function RegisterPage() {
  const { address, isConnected } = useAccount();
  const { analyticsRegistry, getSigner } = useContractsSafe();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategoryType>("DeFi");
  const [contractAddresses, setContractAddresses] = useState<string[]>([""]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredDAppId, setRegisteredDAppId] = useState<string | null>(null);

  const addAddressField = () => {
    if (contractAddresses.length < 10) {
      setContractAddresses([...contractAddresses, ""]);
    }
  };

  const removeAddressField = (index: number) => {
    if (contractAddresses.length > 1) {
      setContractAddresses(contractAddresses.filter((_, i) => i !== index));
    }
  };

  const updateAddress = (index: number, value: string) => {
    const newAddresses = [...contractAddresses];
    newAddresses[index] = value;
    setContractAddresses(newAddresses);
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleRegister = async () => {
    console.log("handleRegister called - isConnected:", isConnected, "address:", address);

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!analyticsRegistry) {
      toast.error("Contract not initialized");
      return;
    }

    // Validation
    if (name.length < 3 || name.length > 50) {
      toast.error("Name must be between 3 and 50 characters");
      return;
    }

    const validAddresses = contractAddresses.filter((addr) => isValidAddress(addr));
    if (validAddresses.length === 0) {
      toast.error("Please enter at least one valid contract address");
      return;
    }

    try {
      setIsRegistering(true);

      console.log("Attempting to get signer...");
      // Get signer from wallet
      const signerResolved = await getSigner();
      console.log("Signer result:", signerResolved);

      if (!signerResolved) {
        toast.error("Please connect your wallet to perform transactions");
        setIsRegistering(false);
        return;
      }

      const registryContract = analyticsRegistry.connect(signerResolved) as any;

      toast.loading("Registering DApp...");

      const tx = await registryContract.registerDApp(
        name,
        category,
        validAddresses
      );

      toast.loading("Waiting for confirmation...");
      const receipt = await tx.wait();

      // Extract DApp ID from event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return registryContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === "DAppRegistered");

      const dAppId = event?.args[0]?.toString() || "Unknown";

      toast.success("DApp registered successfully!");
      setRegisteredDAppId(dAppId);

      // Reset form
      setName("");
      setCategory("DeFi");
      setContractAddresses([""]);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error?.message || "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Register Your DApp
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get started with real-time analytics for your application
        </p>
      </div>

      {/* Registration Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-6">
          {/* DApp Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              DApp Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-900"
              placeholder="My Awesome DApp"
              maxLength={50}
            />
            <p className="mt-1 text-xs text-gray-500">
              {name.length}/50 characters
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:focus:ring-blue-900"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Addresses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Contract Addresses *
            </label>
            <p className="mt-1 text-xs text-gray-500">
              Add 1-10 contract addresses associated with your DApp
            </p>
            <div className="mt-3 space-y-2">
              {contractAddresses.map((addr, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={addr}
                    onChange={(e) => updateAddress(index, e.target.value)}
                    className={`flex-1 rounded-lg border px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:bg-gray-800 dark:focus:ring-blue-900 ${
                      addr && !isValidAddress(addr)
                        ? "border-red-500 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="0x..."
                  />
                  {contractAddresses.length > 1 && (
                    <button
                      onClick={() => removeAddressField(index)}
                      className="rounded-lg bg-red-100 p-3 text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              {contractAddresses.length < 10 && (
                <button
                  onClick={addAddressField}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Address
                </button>
              )}
            </div>
          </div>

          {/* Register Button */}
          <button
            onClick={handleRegister}
            disabled={
              isRegistering ||
              !isConnected ||
              name.length < 3 ||
              contractAddresses.filter((a) => isValidAddress(a)).length === 0
            }
            className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 py-4 font-bold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isRegistering ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Registering...
              </span>
            ) : !isConnected ? (
              "Connect Wallet to Register"
            ) : (
              "Register DApp"
            )}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {registeredDAppId && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-900/20">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-300">
                Registration Successful!
              </h3>
              <p className="mt-1 text-sm text-green-800 dark:text-green-300">
                Your DApp has been registered with ID: <span className="font-mono font-bold">{registeredDAppId}</span>
              </p>
              <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                You can now start tracking analytics. Go to the dashboard to see your data!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            What happens next?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>• Your DApp is registered on-chain</li>
            <li>• Analytics tracking starts immediately</li>
            <li>• View real-time metrics on dashboard</li>
            <li>• Track user journeys and sessions</li>
          </ul>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Need Help?
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Check out our documentation to integrate analytics into your DApp and
            start collecting valuable insights.
          </p>
        </div>
      </div>
    </div>
  );
}
