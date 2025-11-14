"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Activity,
  BarChart3,
  Gauge,
  Zap,
  ShieldCheck,
} from "lucide-react";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.replace("/dashboard");
  }, [isConnected, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-950 to-gray-900 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-gray-950/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Lena" className="h-7 w-7" />
            <span className="text-sm font-semibold tracking-wide">Lena</span>
          </a>
          <nav className="flex items-center gap-3">
            <a href="/events" className="hidden rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/10 sm:inline-block">Events</a>
            <ConnectButton />
          </nav>
        </div>
      </header>

      {/* HERO – full width, immersive */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_20%_10%,rgba(59,130,246,0.25),transparent_60%),radial-gradient(50%_50%_at_90%_20%,rgba(168,85,247,0.25),transparent_60%),radial-gradient(40%_40%_at_60%_80%,rgba(6,182,212,0.25),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-blue-300/80">Built for Somnia</p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-6xl">
                The Ultimate Command Center for Your DApps
              </h1>
              <p className="mt-4 max-w-xl text-gray-300">
                Lena gives you live visibility into sessions, events, and KPIs with sub‑second streams from Somnia. Observe user journeys, spot errors instantly, and ship with confidence.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ConnectPrimary />
                <a href="/events" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur transition-colors hover:bg-white/10">
                  View Live Events
                </a>
              </div>
            </div>
            <div className="order-first md:order-none">
              <div className="relative mx-auto h-[320px] w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur">
                <div className="flex h-full items-center justify-center">
                  <img src="/logo.svg" alt="Lena Logo" className="h-24 w-24 opacity-90" />
                </div>
                <div className="pointer-events-none absolute inset-x-6 -bottom-6 h-12 rounded-xl bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-cyan-500/30 blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE STRIP */}
      <section className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-4 md:grid-cols-4">
            <FeatureCard icon={<BarChart3 className="h-5 w-5" />} title="Unified Dashboard" desc="Sessions, events, errors, success rate, and throughput." />
            <FeatureCard icon={<Activity className="h-5 w-5" />} title="Live Streams" desc="Sub‑second data from Somnia Data Streams." />
            <FeatureCard icon={<Gauge className="h-5 w-5" />} title="Actionable Metrics" desc="On‑chain KPIs via Metrics Aggregator." />
            <FeatureCard icon={<Zap className="h-5 w-5" />} title="Developer‑Ready" desc="Contracts, SDKs, and a demo DEX." />
          </div>
        </div>
      </section>

      {/* VALUE SECTION 1 */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">One Dashboard to Rule Them All</h2>
              <p className="mt-3 text-gray-300">
                Combine historical and real‑time views to understand how users move through your dApp. Translate granular contract events into journeys, funnels, and retention.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-blue-400" /> Accurate, on‑chain computed stats.</li>
                <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-blue-400" /> Seamless with Somnia Testnet.</li>
                <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-blue-400" /> Built for product, data, and dev teams.</li>
              </ul>
            </div>
            <div className="h-64 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-blue-500/10 to-indigo-500/10" />
          </div>
        </div>
      </section>

      {/* VALUE SECTION 2 */}
      <section className="border-t border-white/10 bg-white/5">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="order-last md:order-none h-64 w-full rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10" />
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Explore and Interact with Ease</h2>
              <p className="mt-3 text-gray-300">
                Spin up a real transaction flow with our demo DEX, or register your own dApp. Lena’s Contracts and SDK make event logging straightforward while preserving on‑chain verifiability.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href="/swap" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">Try the Demo Swap</a>
                <a href="/register" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10">Register Your DApp</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h3 className="text-2xl font-semibold sm:text-3xl">Ready to take control of your on‑chain activity?</h3>
          <p className="mx-auto mt-3 max-w-2xl text-gray-300">
            Join builders who rely on Lena for live observability on the Somnia network. Connect your wallet to get started.
          </p>
          <div className="mt-8 flex justify-center">
            <ConnectPrimary />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-gray-300">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function ConnectPrimary() {
  return (
    <div className="relative inline-flex">
      <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-40 blur" />
      <div className="relative">
        <ConnectButton />
      </div>
    </div>
  );
}
