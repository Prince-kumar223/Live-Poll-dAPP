import type { AppError } from "../lib/errors";

type ErrorBannerProps = {
  error: AppError | null;
  onDismiss: () => void;
};

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="rounded-[26px] border border-rose-400/20 bg-[linear-gradient(135deg,rgba(35,10,25,0.92),rgba(63,15,38,0.84))] px-5 py-4 text-rose-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_18px_40px_rgba(30,6,20,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-rose-200/70">
            Error
          </p>
          <p className="mt-2 text-sm">{error.message}</p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="neo-pill rounded-full px-3 py-1 text-xs font-semibold text-rose-100 transition hover:-translate-y-0.5"
          aria-label="Dismiss error"
        >
          Close
        </button>
      </div>
    </div>
  );
}
