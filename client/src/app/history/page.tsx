"use client";

import { TransactionHistory } from "@/components/transaction-history";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <TransactionHistory />
    </div>
  );
}
