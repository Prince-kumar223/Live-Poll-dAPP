import { ResultsBar } from "./ResultsBar";
import { TxStatusBadge } from "./TxStatusBadge";

type PollCardProps = {
  question: string;
  results: Array<{
    optionIndex: number;
    optionLabel: string;
    votes: number;
    percentage: number;
  }>;
  hasVoted: boolean;
  canVote: boolean;
  isLoading: boolean;
  isLive: boolean;
  txStatus: "idle" | "pending" | "success" | "fail";
  txHash?: string;
  errorMessage?: string;
  onVote: (optionIndex: number) => Promise<void>;
};

export function PollCard({
  question,
  results,
  hasVoted,
  canVote,
  isLoading,
  isLive,
  txStatus,
  txHash,
  errorMessage,
  onVote,
}: PollCardProps) {
  const disabled = !canVote || hasVoted || txStatus === "pending";
  const totalVotes = results.reduce((sum, result) => sum + result.votes, 0);
  const leader = [...results].sort((a, b) => b.votes - a.votes)[0];

  return (
    <section className="panel-shell rounded-[34px] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="neo-pill inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.26em] text-slate-300">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isLive ? "animate-pulse-soft bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.8)]" : "bg-slate-500"
              }`}
            />
            {isLive ? "Live Sync" : "Reconnecting"}
          </div>
          <h2 className="display-font neon-text mt-4 text-3xl font-semibold tracking-tight text-white sm:text-[2.6rem]">
            {question || "Loading poll question..."}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Submit one wallet-verified vote and watch the dashboard rebalance as
            fresh Soroban events arrive.
          </p>
        </div>

        <div className="grid min-w-[240px] gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <div className="neo-pill rounded-[26px] p-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
              Total votes
            </p>
            <p className="display-font mt-3 text-3xl font-semibold text-white">{totalVotes}</p>
          </div>
          <div className="neo-pill rounded-[26px] p-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
              Leading option
            </p>
            <p className="mt-3 truncate text-lg font-semibold text-white">
              {leader?.optionLabel ?? "--"}
            </p>
          </div>
          <div className="neo-pill rounded-[26px] p-4">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">
              Vote status
            </p>
            <p className="mt-3 text-lg font-semibold text-white">
              {hasVoted ? "Locked" : canVote ? "Ready" : "Connect wallet"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="neo-pill rounded-[30px] p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Vote distribution</p>
            <div className="neo-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Realtime
            </div>
          </div>

          <div className="mt-5 flex h-[320px] items-end gap-3 overflow-hidden rounded-[26px] border border-indigo-200/10 bg-[linear-gradient(180deg,rgba(12,16,38,0.92),rgba(7,10,18,0.78))] px-4 pb-4 pt-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {results.map((result, index) => {
              const barHeight = Math.max(result.percentage * 2.2, result.votes > 0 ? 56 : 18);
              const barTone =
                index === 0
                  ? "from-cyan-300 via-sky-400 to-indigo-500"
                  : "from-fuchsia-400 via-violet-500 to-indigo-600";

              return (
                <div key={result.optionIndex} className="flex flex-1 flex-col items-center gap-3">
                  <div className="text-xs font-semibold text-slate-400">
                    {result.percentage}%
                  </div>
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className={`w-full max-w-[72px] rounded-[18px] bg-gradient-to-b ${barTone} shadow-[0_0_36px_rgba(96,107,255,0.24)] transition-all duration-700`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">{result.optionLabel}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {result.votes} votes
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="neo-pill rounded-[30px] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Cast your vote</p>
              <div className="neo-pill rounded-full px-3 py-1 text-xs font-semibold text-slate-300">
                One vote per wallet
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {results.map((result, index) => (
                <button
                  key={result.optionIndex}
                  type="button"
                  disabled={disabled || isLoading}
                  onClick={() => void onVote(result.optionIndex)}
                  className={`w-full rounded-[26px] border p-4 text-left transition duration-300 ${
                    disabled || isLoading
                      ? "cursor-not-allowed border-white/8 bg-white/[0.03] opacity-70"
                      : "border-indigo-200/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-[linear-gradient(180deg,rgba(91,96,255,0.16),rgba(34,211,238,0.08))]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">{result.optionLabel}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {hasVoted
                          ? "Vote locked for this address"
                          : "Submit on Stellar Testnet"}
                      </p>
                    </div>
                    <div
                      className={`h-11 w-11 rounded-full border border-white/10 bg-gradient-to-br shadow-[0_0_24px_rgba(95,96,255,0.16)] ${
                        index === 0
                          ? "from-cyan-300/30 to-indigo-500/25"
                          : "from-fuchsia-300/30 to-violet-500/25"
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4">
              <TxStatusBadge
                status={txStatus}
                txHash={txHash}
                errorMessage={errorMessage}
              />
            </div>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <ResultsBar
                key={result.optionIndex}
                label={result.optionLabel}
                votes={result.votes}
                percentage={result.percentage}
                tone={index === 0 ? "mint" : "gold"}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
