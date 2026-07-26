"use client";

import { create } from "zustand";
import type { TransactionRecord, ContractEvent } from "@/types";

interface TransactionStore {
  transactions: TransactionRecord[];
  events: ContractEvent[];
  addTransaction: (tx: TransactionRecord) => void;
  updateTransaction: (hash: string, status: TransactionRecord["status"], error?: string) => void;
  addEvent: (event: ContractEvent) => void;
  getRecentTransactions: (limit?: number) => TransactionRecord[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  events: [],
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [tx, ...state.transactions].slice(0, 50),
    })),
  updateTransaction: (hash, status, error) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.hash === hash ? { ...tx, status, error } : tx
      ),
    })),
  addEvent: (event) =>
    set((state) => ({
      events: [event, ...state.events].slice(0, 100),
    })),
  getRecentTransactions: (limit = 10) =>
    get().transactions.slice(0, limit),
}));
