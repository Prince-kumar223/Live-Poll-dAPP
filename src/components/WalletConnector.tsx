import { FREIGHTER_ID, LOBSTR_ID, XBULL_ID } from "../hooks/useWallet";
import { truncateAddress } from "../lib/contract";

type WalletConnectorProps = {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  selectedWalletId: string;
  onConnect: (walletId?: string) => Promise<string | void>;
  onDisconnect: () => Promise<void> | void;
};

const walletOptions = [
  { id: XBULL_ID, label: "xBull", accent: "from-cyan-400 to-indigo-500" },
  { id: FREIGHTER_ID, label: "Freighter", accent: "from-fuchsia-400 to-violet-500" },
  { id: LOBSTR_ID, label: "LOBSTR", accent: "from-emerald-400 to-cyan-400" },
];

export function WalletConnector({
  address,
  isConnected,
  isConnecting,
  selectedWalletId,
  onConnect,
  onDisconnect,
}: WalletConnectorProps) {
  return (
    <div className="panel-shell flex flex-col gap-4 rounded-[30px] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">
            Wallet Access
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {isConnected && address
              ? truncateAddress(address, 8, 6)
              : "Choose a Stellar wallet to join the poll"}
          </p>
        </div>

        <div className="neo-pill rounded-full px-3 py-1 text-xs font-semibold text-slate-200">
          {isConnected ? "Connected" : "Offline"}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {walletOptions.map((wallet) => {
          const selected = wallet.id === selectedWalletId;

          return (
            <button
              key={wallet.id}
              type="button"
              onClick={() => void onConnect(wallet.id)}
              disabled={isConnecting}
              className={`group relative overflow-hidden rounded-[24px] border px-4 py-3 text-left transition duration-300 ${
                selected
                  ? "border-indigo-300/35 bg-[linear-gradient(135deg,rgba(95,67,255,0.2),rgba(34,211,238,0.08))] shadow-[0_0_0_1px_rgba(168,85,247,0.15),0_18px_40px_rgba(37,46,120,0.2)]"
                  : "border-white/8 bg-white/[0.03] hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-white/[0.06]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span
                className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${wallet.accent} opacity-90`}
              />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{wallet.label}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    {selected ? "Selected" : "Available"}
                  </p>
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${wallet.accent} ${
                    selected
                      ? "opacity-100 shadow-[0_0_18px_rgba(103,232,249,0.8)]"
                      : "opacity-45 group-hover:opacity-80"
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="neo-pill rounded-[24px] px-4 py-3 text-sm text-slate-300">
          {isConnected && address
            ? `Active address ${truncateAddress(address, 10, 8)}`
            : "No wallet active yet. Connect to unlock voting."}
        </div>

        {isConnected ? (
          <button
            type="button"
            onClick={() => void onDisconnect()}
            className="neo-pill rounded-full px-5 py-2.5 text-sm font-semibold text-slate-100 transition duration-300 hover:-translate-y-0.5"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void onConnect(selectedWalletId)}
            disabled={isConnecting}
            className="neo-button rounded-full px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
  );
}
