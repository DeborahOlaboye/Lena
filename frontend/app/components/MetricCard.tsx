"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "../lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  loading?: boolean;
}

const colorClasses = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = "blue",
  loading = false,
}: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      {/* Background Gradient */}
      <div
        className={cn(
          "absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br opacity-10 blur-3xl transition-all group-hover:opacity-20",
          colorClasses[color]
        )}
      />

      {/* Content */}
      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            {loading ? (
              <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white",
              colorClasses[color]
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>

        {/* Trend Indicator */}
        {trendValue && trend && (
          <div className="mt-4 flex items-center gap-1">
            <span
              className={cn(
                "text-sm font-medium",
                trend === "up" && "text-green-600 dark:text-green-400",
                trend === "down" && "text-red-600 dark:text-red-400",
                trend === "neutral" && "text-gray-600 dark:text-gray-400"
              )}
            >
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trend === "neutral" && "→"} {trendValue}
            </span>
            <span className="text-xs text-gray-500">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
}
