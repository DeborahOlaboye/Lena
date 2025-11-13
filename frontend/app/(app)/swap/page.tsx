"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { ArrowDownUp, Settings, Loader2, CheckCircle2 } from "lucide-react";
import { useContractsSafe } from "../../hooks/useContractsSafe";
import { toast } from "react-hot-toast";
import { formatNumber } from "../../lib/utils";

export default function SwapPage() {
  const { address, isConnected } = useAccount();
  const { simpleSwap, getSigner } = useContractsSafe();

  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapDirection, setSwapDirection] = useState<"AtoB" | "BtoA">("AtoB");
  const [slippage, setSlippage] = useState("0.5");
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsLogged, setAnalyticsLogged] = useState(false);

  const [reserveA, setReserveA] = useState<bigint>(BigInt(0));
  const [reserveB, setReserveB] = useState<bigint>(BigInt(0));

  // Liquidity state
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [liquidityAmountA, setLiquidityAmountA] = useState("");
  const [liquidityAmountB, setLiquidityAmountB] = useState("");
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);

  // Load reserves
  useEffect(() => {
    if (simpleSwap) {
      simpleSwap.getReserves().then(([resA, resB]: [bigint, bigint]) => {
        console.log("Reserves loaded:", resA.toString(), resB.toString());
        setReserveA(resA);
        setReserveB(resB);
        // Auto-show add liquidity if no liquidity
        if (resA === BigInt(0) || resB === BigInt(0)) {
          setShowAddLiquidity(true);
        }
      }).catch((err: any) => {
        console.error("Error loading reserves:", err);
      });
    }
  }, [simpleSwap]);

  const calculateOutput = (input: string) => {
    if (!input || !simpleSwap) return "0";
    try {
      const inputAmount = ethers.parseEther(input);
      const isAtoB = swapDirection === "AtoB";

      // Simplified calculation - using constant product formula
      const amountInWithFee = inputAmount * BigInt(9970); // 0.3% fee
      const reserveIn = isAtoB ? reserveA : reserveB;
      const reserveOut = isAtoB ? reserveB : reserveA;

      const numerator = amountInWithFee * reserveOut;
      const denominator = (reserveIn * BigInt(10000)) + amountInWithFee;
      const output = numerator / denominator;

      return ethers.formatEther(output);
    } catch {
      return "0";
    }
  };

  const handleInputChange = (value: string, field: "A" | "B") => {
    if (field === "A") {
      setAmountA(value);
      if (swapDirection === "AtoB") {
        setAmountB(calculateOutput(value));
      }
    } else {
      setAmountB(value);
      if (swapDirection === "BtoA") {
        setAmountA(calculateOutput(value));
      }
    }
  };

  const handleSwapDirection = () => {
    setSwapDirection(swapDirection === "AtoB" ? "BtoA" : "AtoB");
    const temp = amountA;
    setAmountA(amountB);
    setAmountB(temp);
  };

  const handleAddLiquidity = async () => {
    console.log("handleAddLiquidity called - isConnected:", isConnected, "address:", address);

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!simpleSwap) {
      toast.error("Contract not initialized");
      return;
    }

    if (!liquidityAmountA || !liquidityAmountB || parseFloat(liquidityAmountA) <= 0 || parseFloat(liquidityAmountB) <= 0) {
      toast.error("Please enter valid amounts for both tokens");
      return;
    }

    try {
      setIsAddingLiquidity(true);

      console.log("Attempting to get signer...");
      const signerResolved = await getSigner();
      console.log("Signer result:", signerResolved);

      if (!signerResolved) {
        toast.error("Please connect your wallet to perform transactions");
        setIsAddingLiquidity(false);
        return;
      }

      const swapContract = simpleSwap.connect(signerResolved) as any;

      const amtA = ethers.parseEther(liquidityAmountA);
      const amtB = ethers.parseEther(liquidityAmountB);

      toast.loading("Adding liquidity...");

      const tx = await swapContract.addLiquidity(amtA, amtB);

      toast.loading("Waiting for confirmation...");
      await tx.wait();

      toast.success("Liquidity added successfully!");

      // Refresh reserves
      const [resA, resB] = await simpleSwap.getReserves();
      setReserveA(resA);
      setReserveB(resB);

      // Reset form
      setLiquidityAmountA("");
      setLiquidityAmountB("");
      setShowAddLiquidity(false);

    } catch (error: any) {
      console.error("Add liquidity error:", error);
      toast.error(error?.message || "Failed to add liquidity");
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  const handleSwap = async () => {
    console.log("handleSwap called - isConnected:", isConnected, "address:", address);

    if (!isConnected) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!simpleSwap) {
      toast.error("Contract not initialized");
      return;
    }

    const inputAmount = swapDirection === "AtoB" ? amountA : amountB;
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setIsSwapping(true);
      setAnalyticsLogged(false);

      console.log("Attempting to get signer...");
      // Get signer from wallet
      const signerResolved = await getSigner();
      console.log("Signer result:", signerResolved);

      if (!signerResolved) {
        toast.error("Please connect your wallet to perform transactions");
        setIsSwapping(false);
        return;
      }

      const swapContract = simpleSwap.connect(signerResolved) as any;

      const amountIn = ethers.parseEther(inputAmount);
      const expectedOut = ethers.parseEther(swapDirection === "AtoB" ? amountB : amountA);
      const slippageMultiplier = (100 - parseFloat(slippage)) / 100;
      const minAmountOut = (expectedOut * BigInt(Math.floor(slippageMultiplier * 100))) / BigInt(100);

      toast.loading("Executing swap...");

      const tx = await swapContract.swap(
        swapDirection === "AtoB",
        amountIn,
        minAmountOut
      );

      toast.loading("Waiting for confirmation...");
      await tx.wait();

      toast.success("Swap successful!");
      setAnalyticsLogged(true);

      // Refresh reserves
      const [resA, resB] = await simpleSwap.getReserves();
      setReserveA(resA);
      setReserveB(resB);

      // Reset form
      setAmountA("");
      setAmountB("");

      setTimeout(() => setAnalyticsLogged(false), 5000);
    } catch (error: any) {
      console.error("Swap error:", error);
      toast.error(error?.message || "Swap failed");
    } finally {
      setIsSwapping(false);
    }
  };

  const exchangeRate = reserveB > BigInt(0)
    ? (Number(reserveA) / Number(reserveB)).toFixed(4)
    : "0";

  const hasLiquidity = reserveA > BigInt(0) && reserveB > BigInt(0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Demo Swap
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Experience real-time analytics tracking
        </p>
      </div>

      {/* No Liquidity Warning */}
      {!hasLiquidity && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-900 dark:bg-orange-900/20">
          <h3 className="font-semibold text-orange-900 dark:text-orange-300">
            No Liquidity Available
          </h3>
          <p className="mt-2 text-sm text-orange-800 dark:text-orange-300">
            The pool needs liquidity before you can swap. Click "Add Liquidity" to add initial liquidity.
          </p>
          <button
            onClick={() => setShowAddLiquidity(true)}
            className="mt-4 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2 font-medium text-white transition-transform hover:scale-105"
          >
            Add Liquidity
          </button>
        </div>
      )}

      {/* Add Liquidity Section */}
      {showAddLiquidity && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Liquidity
            </h2>
            <button
              onClick={() => setShowAddLiquidity(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Token A Input */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <label className="text-sm text-gray-600 dark:text-gray-400">Token A Amount</label>
            <input
              type="number"
              value={liquidityAmountA}
              onChange={(e) => setLiquidityAmountA(e.target.value)}
              className="mt-2 w-full bg-transparent text-2xl font-bold outline-none dark:text-white"
              placeholder="0.0"
            />
          </div>

          {/* Token B Input */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <label className="text-sm text-gray-600 dark:text-gray-400">Token B Amount</label>
            <input
              type="number"
              value={liquidityAmountB}
              onChange={(e) => setLiquidityAmountB(e.target.value)}
              className="mt-2 w-full bg-transparent text-2xl font-bold outline-none dark:text-white"
              placeholder="0.0"
            />
          </div>

          {/* Add Liquidity Button */}
          <button
            onClick={handleAddLiquidity}
            disabled={isAddingLiquidity || !isConnected || !liquidityAmountA || !liquidityAmountB}
            className="w-full rounded-lg bg-gradient-to-r from-green-500 to-teal-600 py-4 font-bold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isAddingLiquidity ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Adding Liquidity...
              </span>
            ) : !isConnected ? (
              "Connect Wallet"
            ) : (
              "Add Liquidity"
            )}
          </button>
        </div>
      )}

      {/* Swap Interface */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-800 dark:bg-gray-900">
        {/* Settings Button */}
        <div className="mb-4 flex justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Swap Tokens
          </h2>
          <div className="flex gap-2">
            {hasLiquidity && !showAddLiquidity && (
              <button
                onClick={() => setShowAddLiquidity(true)}
                className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                + Add Liquidity
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Slippage Tolerance
            </label>
            <div className="mt-2 flex gap-2">
              {["0.1", "0.5", "1.0"].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    slippage === val
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {val}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                placeholder="Custom"
              />
            </div>
          </div>
        )}

        {/* Token A Input */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">From</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance: {formatNumber(reserveA)} STT-A
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={amountA}
              onChange={(e) => handleInputChange(e.target.value, "A")}
              className="flex-1 bg-transparent text-2xl font-bold outline-none dark:text-white"
              placeholder="0.0"
            />
            <div className="rounded-lg bg-white px-4 py-2 font-semibold dark:bg-gray-700">
              STT-A
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="my-4 flex justify-center">
          <button
            onClick={handleSwapDirection}
            className="rounded-full bg-gray-100 p-3 transition-transform hover:scale-110 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <ArrowDownUp className="h-5 w-5" />
          </button>
        </div>

        {/* Token B Input */}
        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">To</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Balance: {formatNumber(reserveB)} STT-B
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={amountB}
              onChange={(e) => handleInputChange(e.target.value, "B")}
              className="flex-1 bg-transparent text-2xl font-bold outline-none dark:text-white"
              placeholder="0.0"
            />
            <div className="rounded-lg bg-white px-4 py-2 font-semibold dark:bg-gray-700">
              STT-B
            </div>
          </div>
        </div>

        {/* Swap Details */}
        <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Exchange Rate</span>
            <span className="font-medium">1 STT-A = {exchangeRate} STT-B</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance</span>
            <span className="font-medium">{slippage}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Fee (0.3%)</span>
            <span className="font-medium">
              {(parseFloat(amountA || "0") * 0.003).toFixed(4)} STT
            </span>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || !isConnected || !amountA || parseFloat(amountA) <= 0 || !hasLiquidity}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 py-4 font-bold text-white transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          {isSwapping ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Swapping...
            </span>
          ) : !isConnected ? (
            "Connect Wallet"
          ) : !hasLiquidity ? (
            "Add Liquidity First"
          ) : (
            "Swap"
          )}
        </button>

        {/* Analytics Badge */}
        {analyticsLogged && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-green-700 dark:text-green-300">
              Analytics Logged Successfully!
            </span>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300">
          How it works
        </h3>
        <p className="mt-2 text-sm text-blue-800 dark:text-blue-300">
          Every swap is automatically logged to the analytics platform. You can see
          real-time updates on the dashboard, including transaction metrics, user
          activity, and more. Try it now and watch the magic happen!
        </p>
      </div>
    </div>
  );
}
