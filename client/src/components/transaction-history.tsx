"use client";

import {
  History,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useTransactionStore } from "@/stores/transactions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { truncateAddress, timeAgo, explorerUrl } from "@/lib/utils";

const statusConfig = {
  pending: {
    icon: Loader2,
    label: "Pending",
    variant: "warning" as const,
    iconClass: "animate-spin",
  },
  success: {
    icon: CheckCircle,
    label: "Success",
    variant: "success" as const,
    iconClass: "",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    variant: "danger" as const,
    iconClass: "",
  },
};

export function TransactionHistory() {
  const { transactions } = useTransactionStore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Transaction History</h1>
        <p className="text-sm text-zinc-500">
          Recent contract interactions and their status
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <History className="h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-zinc-400">No transactions yet</p>
          <p className="text-sm text-zinc-600 mt-1">
            Your contract interactions will appear here
          </p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => {
                const config = statusConfig[tx.status];
                const Icon = config.icon;

                return (
                  <div
                    key={tx.hash}
                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-800 bg-zinc-800/30"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`shrink-0 ${config.variant === "success" ? "text-emerald-400" : config.variant === "danger" ? "text-red-400" : "text-amber-400"}`}
                      >
                        <Icon
                          className={`h-5 w-5 ${config.iconClass}`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-zinc-200 capitalize">
                            {tx.method.replace(/_/g, " ")}
                          </span>
                          <Badge variant={config.variant}>
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="font-mono">
                            {truncateAddress(tx.hash, 8)}
                          </span>
                          <span>{timeAgo(tx.timestamp)}</span>
                        </div>
                        {tx.error && (
                          <p className="mt-1 text-xs text-red-400">
                            {tx.error}
                          </p>
                        )}
                      </div>
                    </div>

                    {!tx.hash.startsWith("pending-") && (
                      <a
                        href={explorerUrl(tx.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
