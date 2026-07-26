"use client";

import { useCallback, useEffect, useState } from "react";
import {
  StellarWalletsKit,
  Networks,
  KitEventType,
} from "@creit.tech/stellar-wallets-kit";
import { FreighterModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { useWalletStore } from "@/stores/wallet";
import { NETWORK_PASSPHRASE } from "@/lib/stellar";

let initialized = false;
function ensureInit() {
  if (!initialized) {
    StellarWalletsKit.init({
      modules: [new FreighterModule(), new LobstrModule()],
      network: Networks.TESTNET,
    });
    initialized = true;
  }
}

export function useWallet() {
  const { address, isConnected, walletName, setWallet, disconnect } =
    useWalletStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureInit();

    const unsubState = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event) => {
        if (event.payload.address) {
          setWallet(event.payload.address, walletName || "Wallet");
        }
      }
    );

    const unsubDisconnect = StellarWalletsKit.on(
      KitEventType.DISCONNECT,
      () => {
        disconnect();
      }
    );

    StellarWalletsKit.getAddress()
      .then(({ address: addr }) => {
        if (addr) {
          setWallet(addr, walletName || "Wallet");
        }
      })
      .catch(() => {});

    return () => {
      unsubState();
      unsubDisconnect();
    };
  }, [setWallet, disconnect, walletName]);

  const connect = useCallback(async () => {
    ensureInit();
    setIsConnecting(true);
    setError(null);
    try {
      const { address: addr } = await StellarWalletsKit.authModal();
      if (addr) {
        const wallets = await StellarWalletsKit.refreshSupportedWallets();
        const active = wallets.find((w) => w.isAvailable);
        setWallet(addr, active?.name || "Wallet");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        !msg.includes("reject") &&
        !msg.includes("denied") &&
        !msg.includes("cancel")
      ) {
        setError(
          "Wallet not found. Please install a Stellar wallet extension like Freighter."
        );
      }
    } finally {
      setIsConnecting(false);
    }
  }, [setWallet]);

  const disconnectWallet = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
      disconnect();
    } catch {
      disconnect();
    }
  }, [disconnect]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!address) throw new Error("Wallet not connected");
      try {
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
          networkPassphrase: NETWORK_PASSPHRASE,
        });
        return signedTxXdr;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("reject") || msg.includes("denied")) {
          throw new Error("Transaction rejected by wallet");
        }
        throw new Error("Failed to sign transaction");
      }
    },
    [address]
  );

  return {
    address,
    isConnected,
    walletName,
    isConnecting,
    error,
    connect,
    disconnect: disconnectWallet,
    signTransaction,
    clearError: () => setError(null),
  };
}
