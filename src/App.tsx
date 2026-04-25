import { useEffect, useMemo, useState } from "react";
import { ErrorBanner } from "./components/ErrorBanner";
import { PollCard } from "./components/PollCard";
import { WalletConnector } from "./components/WalletConnector";
import { useEventListener } from "./hooks/useEventListener";
import { usePoll } from "./hooks/usePoll";
import { useVote } from "./hooks/useVote";
import { useWallet } from "./hooks/useWallet";
import {
  CONTRACT_ID,
  getExplorerContractUrl,
  getExplorerTxUrl,
  truncateAddress,
} from "./lib/contract";
import type { AppError } from "./lib/errors";

export default function App() {
  const wallet = useWallet();
  const poll = usePoll(wallet.address);
  const vote = useVote({
    address: wallet.address,
    signTransaction: wallet.signTransaction,
    onSuccess: poll.refetch,
  });
  const { isLive } = useEventListener({
    onVoteEvent: poll.refetch,
  });

  const [activeError, setActiveError] = useState<AppError | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setActiveError(wallet.error ?? poll.error ?? vote.error ?? null);
  }, [wallet.error, poll.error, vote.error]);

  async function handleVote(optionIndex: number) {
    try {
      await vote.submitVote(optionIndex);
    } catch {
      return;
    }
  }

  async function copyContractAddress() {
    if (!CONTRACT_ID) {
      return;
    }

    await navigator.clipboard.writeText(CONTRACT_ID);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const totalVotes = useMemo(
    () => poll.results.reduce((sum, result) => sum + result.votes, 0),
    [poll.results],
  );
  const leading = useMemo(
    () => [...poll.results].sort((a, b) => b.votes - a.votes)[0],
    [poll.results],
  );
  const spread = useMemo(() => {
    if (poll.results.length < 2) {
      return 0;
    }

    return Math.abs(poll.results[0].percentage - poll.results[1].percentage);
  }, [poll.results]);

  return (
    <div className="app-shell min-h-screen bg-[#060816] text-slate-100">
      <div className="relative mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="panel-shell sticky top-4 z-20 rounded-[32px] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="glow-ring flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#8b5cf6_0%,#4f46e5_48%,#22d3ee_100%)] text-sm font-bold text-white">
                  LP
                </div>
                <div>
                  <p className="display-font text-lg font-semibold tracking-tight text-white">
                    Live Poll
                  </p>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Stellar Monthly Challenge - Level 2
                  </p>
                </div>
              </div>

              <h1 className="neon-text mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Poll Statistics
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-[15px]">
                Connect a Stellar wallet, cast one on-chain vote, and watch the
                results update in real time inside a darker dashboard-style
                interface.
              </p>
            </div>

            <div className="w-full max-w-xl">
              <WalletConnector
                address={wallet.address}
                isConnected={wallet.isConnected}
                isConnecting={wallet.isConnecting}
                selectedWalletId={wallet.selectedWalletId}
                onConnect={wallet.connect}
                onDisconnect={wallet.disconnect}
              />
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="panel-shell rounded-[30px] p-5 sm:p-6">
            <p className="text-sm font-medium text-slate-400">Total votes</p>
            <p className="display-font mt-4 text-4xl font-semibold tracking-tight text-white">
              {totalVotes.toLocaleString()}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              Counted on-chain
            </p>
          </div>

          <div className="panel-shell rounded-[30px] p-5 sm:p-6">
            <p className="text-sm font-medium text-slate-400">Leading option</p>
            <p className="display-font mt-4 text-4xl font-semibold tracking-tight text-white">
              {leading?.optionLabel ?? "--"}
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
              {leading ? `${leading.percentage}% share` : "Awaiting data"}
            </p>
          </div>

          <div className="panel-shell rounded-[30px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-400">Realtime sync</p>
                <p className="display-font mt-4 text-4xl font-semibold tracking-tight text-white">
                  {spread}%
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">
                  Vote spread
                </p>
              </div>
              <div className="neo-pill flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-200">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isLive ? "animate-pulse-soft bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" : "bg-slate-500"
                  }`}
                />
                {isLive ? "Live" : "Syncing"}
              </div>
            </div>
          </div>
        </section>

        <main className="mt-5 space-y-5">
          <ErrorBanner error={activeError} onDismiss={() => setActiveError(null)} />

          <PollCard
            question={poll.question}
            results={poll.results}
            hasVoted={poll.hasVoted}
            canVote={wallet.isConnected}
            isLoading={poll.isLoading}
            isLive={isLive}
            txStatus={vote.txStatus}
            txHash={vote.txHash}
            errorMessage={vote.error?.message}
            onVote={handleVote}
          />
        </main>

        <footer className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="panel-shell rounded-[30px] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Contract address
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={getExplorerContractUrl(CONTRACT_ID)}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-cyan-200 underline decoration-cyan-400/60 underline-offset-4 transition hover:text-white"
              >
                {truncateAddress(CONTRACT_ID, 10, 8) || "Set VITE_CONTRACT_ID"}
              </a>
              <button
                type="button"
                onClick={() => void copyContractAddress()}
                className="neo-pill rounded-full px-3 py-1 text-xs font-semibold text-slate-100 transition hover:-translate-y-0.5"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="panel-shell rounded-[30px] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
              Last transaction
            </p>
            {vote.txHash ? (
              <a
                href={getExplorerTxUrl(vote.txHash)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-semibold text-cyan-200 underline decoration-cyan-400/60 underline-offset-4 transition hover:text-white"
              >
                {truncateAddress(vote.txHash, 12, 10)}
              </a>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No vote submitted yet</p>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
