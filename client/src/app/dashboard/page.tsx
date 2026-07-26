"use client";

import { WalletDashboard } from "@/components/wallet-dashboard";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Wallet Dashboard</h1>
        <p className="text-sm text-zinc-500">
          Manage your wallet connection and view your on-chain stats
        </p>
      </div>
      <WalletDashboard />
    </div>
  );
}
