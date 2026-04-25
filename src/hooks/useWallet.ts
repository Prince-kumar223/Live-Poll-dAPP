import { useEffect, useRef, useState } from "react";
import * as WalletKitPackage from "@creit.tech/stellar-wallets-kit";
import { NETWORK_PASSPHRASE } from "../lib/contract";
import {
  normalizeAppError,
  type AppError,
  WalletNotFoundError,
} from "../lib/errors";

type WalletModuleRecord = Record<string, unknown>;

const packageRecord = WalletKitPackage as Record<string, unknown>;
const StellarWalletsKitCtor = packageRecord.StellarWalletsKit as
  | (new (config: WalletModuleRecord) => any)
  | undefined;
const WalletNetwork = (packageRecord.WalletNetwork as Record<string, string>) ?? {};

export const XBULL_ID = String(packageRecord.XBULL_ID ?? "xbull");
export const FREIGHTER_ID = String(packageRecord.FREIGHTER_ID ?? "freighter");
export const LOBSTR_ID = String(packageRecord.LOBSTR_ID ?? "lobstr");

function resolveModules() {
  const allowAllModules = packageRecord.allowAllModules as
    | (() => unknown[])
    | undefined;
  const defaultModules = packageRecord.defaultModules as
    | (() => unknown[])
    | undefined;

  if (typeof allowAllModules === "function") {
    return allowAllModules();
  }

  if (typeof defaultModules === "function") {
    return defaultModules();
  }

  return [];
}

function createKit(selectedWalletId: string) {
  if (!StellarWalletsKitCtor) {
    throw new WalletNotFoundError("StellarWalletsKit constructor was not found.");
  }

  const modules = resolveModules();
  if (!modules.length) {
    throw new WalletNotFoundError("Wallet modules list is empty.");
  }

  return new StellarWalletsKitCtor({
    network: WalletNetwork.TESTNET ?? "TESTNET",
    selectedWalletId,
    modules,
  });
}

async function getAddressFromKit(kit: any) {
  if (typeof kit.getSupportedWallets === "function") {
    const wallets = await kit.getSupportedWallets();
    const available = Array.isArray(wallets)
      ? wallets.some((wallet) => wallet?.isAvailable)
      : false;

    if (!available) {
      throw new WalletNotFoundError("No supported wallet module is currently available.");
    }
  }

  if (typeof kit.getAddress === "function") {
    const result = await kit.getAddress();
    return typeof result === "string" ? result : result?.address;
  }

  if (typeof kit.connect === "function") {
    const result = await kit.connect();
    return typeof result === "string" ? result : result?.address ?? result?.publicKey;
  }

  throw new WalletNotFoundError("No compatible connect/getAddress method found.");
}

async function disconnectKit(kit: any) {
  if (typeof kit.disconnect === "function") {
    await kit.disconnect();
  }
}

async function signWithKit(kit: any, transactionXdr: string, address: string) {
  if (typeof kit.signTransaction === "function") {
    const result = await kit.signTransaction(transactionXdr, {
      address,
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    return result?.signedTxXdr ?? result?.signedTransaction ?? result;
  }

  throw new WalletNotFoundError("Connected wallet does not expose signTransaction.");
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(XBULL_ID);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<AppError | null>(null);
  const kitRef = useRef<any>(null);

  useEffect(() => {
    try {
      kitRef.current = createKit(selectedWalletId);
    } catch (kitError) {
      setError(normalizeAppError(kitError));
    }
  }, [selectedWalletId]);

  async function connect(walletId = selectedWalletId) {
    setIsConnecting(true);
    setError(null);

    try {
      if (!kitRef.current || walletId !== selectedWalletId) {
        setSelectedWalletId(walletId);
        kitRef.current = createKit(walletId);
      }

      if (typeof kitRef.current?.setWallet === "function") {
        kitRef.current.setWallet(walletId);
      }

      const nextAddress = await getAddressFromKit(kitRef.current);

      if (!nextAddress) {
        throw new WalletNotFoundError("Wallet returned an empty address.");
      }

      setAddress(nextAddress);
      return nextAddress;
    } catch (connectError) {
      const normalized = normalizeAppError(connectError);
      setError(normalized);
      throw normalized;
    } finally {
      setIsConnecting(false);
    }
  }

  async function disconnect() {
    if (kitRef.current) {
      await disconnectKit(kitRef.current);
    }

    setAddress(null);
  }

  async function signTransaction(transactionXdr: string) {
    if (!kitRef.current || !address) {
      throw new WalletNotFoundError("Connect a Stellar wallet before signing.");
    }

    try {
      return await signWithKit(kitRef.current, transactionXdr, address);
    } catch (signError) {
      const normalized = normalizeAppError(signError);
      setError(normalized);
      throw normalized;
    }
  }

  return {
    address,
    error,
    isConnected: Boolean(address),
    isConnecting,
    selectedWalletId,
    connect,
    disconnect,
    signTransaction,
  };
}
