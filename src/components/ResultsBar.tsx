type ResultsBarProps = {
  label: string;
  votes: number;
  percentage: number;
  tone: "mint" | "gold";
};

export function ResultsBar({
  label,
  votes,
  percentage,
  tone,
}: ResultsBarProps) {
  const fillClass =
    tone === "mint"
      ? "from-cyan-300 via-sky-400 to-indigo-500"
      : "from-fuchsia-400 via-violet-500 to-indigo-600";

  return (
    <div className="neo-pill rounded-[26px] p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
            {votes} votes
          </p>
        </div>
        <div className="neo-pill rounded-full px-3 py-1 text-sm font-semibold text-slate-100">
          {percentage}%
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${fillClass} shadow-[0_0_22px_rgba(95,96,255,0.35)] transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
