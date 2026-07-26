"use client";

import { useState } from "react";
import {
  Wallet,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "@/hooks/wallet";
import { useContract } from "@/hooks/contract";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { truncateAddress, explorerUrl, contractUrl } from "@/lib/utils";
import { CONTRACT_ADDRESS, RPC_URL } from "@/lib/stellar";
import { toast } from "@/components/ui/toast";

export function WalletDashboard() {
  const { address, isConnected, walletName, connect, disconnect } =
    useWallet();
  const { getFreelancerStats } = useContract();
  const [stats, setStats] = useState<{
    completed_jobs: number;
    total_earned: string;
    rating_sum: number;
    rating_count: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const refreshStats = async () => {
    if (!address) return;
    setLoadingStats(true);
    try {
      const result = (await getFreelancerStats(address)) as {
        completed_jobs: number;
        total_earned: string;
        rating_sum: number;
        rating_count: number;
      };
      setStats(result);
    } catch {
      // Stats may not exist yet
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-purple-400" />
            Wallet Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-500">Connected Wallet</p>
                  <p className="text-sm font-medium text-zinc-200">
                    {walletName}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-400">Connected</span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
                <p className="text-xs text-zinc-500 mb-1">Address</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm text-zinc-200 break-all">
                    {address}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(address || "");
                      toast({
                        title: "Address copied",
                        variant: "success",
                      });
                    }}
                    className="text-zinc-500 hover:text-zinc-300 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(explorerUrl(""), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Explorer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshStats}
                  disabled={loadingStats}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingStats ? "animate-spin" : ""}`}
                  />
                  Refresh Stats
                </Button>
                <Button variant="outline" size="sm" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400 mb-4">
                Connect your wallet to interact with the marketplace
              </p>
              <Button onClick={connect}>
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-400" />
            Network Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
              <p className="text-xs text-zinc-500 mb-1">Network</p>
              <p className="text-sm font-medium text-zinc-200">Testnet</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3">
              <p className="text-xs text-zinc-500 mb-1">RPC Endpoint</p>
              <p className="text-sm font-mono text-zinc-200 truncate">
                {RPC_URL}
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 sm:col-span-2">
              <p className="text-xs text-zinc-500 mb-1">Contract Address</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-zinc-200 break-all">
                  {CONTRACT_ADDRESS}
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(CONTRACT_ADDRESS);
                    toast({
                      title: "Contract address copied",
                      variant: "success",
                    });
                  }}
                  className="text-zinc-500 hover:text-zinc-300 shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={contractUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-500 hover:text-zinc-300 shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freelancer Stats */}
      {isConnected && stats && (
        <Card>
          <CardHeader>
            <CardTitle>Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {stats.completed_jobs}
                </p>
                <p className="text-xs text-zinc-500">Jobs Done</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">
                  {Number(stats.total_earned) / 1_000_000}
                </p>
                <p className="text-xs text-zinc-500">XLM Earned</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">
                  {stats.rating_count > 0
                    ? (stats.rating_sum / stats.rating_count).toFixed(1)
                    : "—"}
                </p>
                <p className="text-xs text-zinc-500">Avg Rating</p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {stats.rating_count}
                </p>
                <p className="text-xs text-zinc-500">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
