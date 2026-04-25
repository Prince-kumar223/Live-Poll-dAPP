import { getExplorerTxUrl } from "../lib/contract";

type TxStatusBadgeProps = {
  status: "idle" | "pending" | "success" | "fail";
  txHash?: string;
  errorMessage?: string;
};

export function TxStatusBadge({
  status,
  txHash,
  errorMessage,
}: TxStatusBadgeProps) {
  if (status === "idle") {
    return null;
  }

  const styles =
    status === "pending"
      ? "border-cyan-400/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(99,102,241,0.1))] text-cyan-100"
      : status === "success"
        ? "border-emerald-400/20 bg-[linear-gradient(135deg,rgba(52,211,153,0.16),rgba(16,185,129,0.08))] text-emerald-100"
        : "border-rose-400/20 bg-[linear-gradient(135deg,rgba(251,113,133,0.16),rgba(244,63,94,0.08))] text-rose-100";

  return (
    <div className={`rounded-[24px] border px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] ${styles}`}>
      <div className="flex items-start gap-3">
        {status === "pending" ? (
          <span className="mt-0.5 h-4 w-4 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-100" />
        ) : status === "success" ? (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-300/20 text-[10px] font-bold text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.32)]">
            OK
          </span>
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-300/20 text-[10px] font-bold text-rose-100 shadow-[0_0_16px_rgba(251,113,133,0.26)]">
            X
          </span>
        )}

        <div className="flex-1">
          <p className="font-semibold">
            {status === "pending"
              ? "Pending confirmation"
              : status === "success"
                ? "Vote confirmed"
                : "Transaction failed"}
          </p>
          <p className="mt-1 text-xs text-white/65">
            {status === "pending"
              ? "Waiting for Stellar RPC finality."
              : status === "success"
                ? "Your vote has been recorded on-chain."
                : errorMessage ?? "The transaction could not be completed."}
          </p>
          {txHash ? (
            <a
              href={getExplorerTxUrl(txHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs font-semibold text-white underline decoration-white/60 underline-offset-4 transition hover:text-cyan-100"
            >
              View transaction
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
