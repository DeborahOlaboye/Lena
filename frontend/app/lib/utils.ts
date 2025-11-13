import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(num: number | bigint): string {
  const n = typeof num === "bigint" ? Number(num) : num;
  if (n >= 1000000) {
    return `${(n / 1000000).toFixed(2)}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(2)}K`;
  }
  return n.toFixed(0);
}

export function formatTimeAgo(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  const seconds = Math.floor(Date.now() / 1000 - ts);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatDuration(seconds: number | bigint): string {
  const s = typeof seconds === "bigint" ? Number(seconds) : seconds;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function formatGas(gas: bigint): string {
  const gasNum = Number(gas);
  if (gasNum >= 1000000) {
    return `${(gasNum / 1000000).toFixed(2)}M`;
  }
  if (gasNum >= 1000) {
    return `${(gasNum / 1000).toFixed(2)}K`;
  }
  return gasNum.toString();
}

export function calculateSuccessRate(
  successful: number | bigint,
  total: number | bigint
): number {
  const s = typeof successful === "bigint" ? Number(successful) : successful;
  const t = typeof total === "bigint" ? Number(total) : total;
  if (t === 0) return 0;
  return (s / t) * 100;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
