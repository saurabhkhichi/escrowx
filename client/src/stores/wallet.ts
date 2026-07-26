"use client";

import { create } from "zustand";

interface WalletStore {
  address: string | null;
  isConnected: boolean;
  walletName: string | null;
  setWallet: (address: string, name: string) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  isConnected: false,
  walletName: null,
  setWallet: (address, name) =>
    set({ address, isConnected: true, walletName: name }),
  disconnect: () =>
    set({ address: null, isConnected: false, walletName: null }),
}));
