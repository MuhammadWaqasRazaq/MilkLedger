import { Loader2 } from "lucide-react";
import { cx } from "../../utils/cx";

export function Spinner({ className, size = 20 }) {
  return (
    <Loader2
      size={size}
      className={cx("animate-spin text-brand-600 dark:text-brand-400", className)}
    />
  );
}

export function LoadingBlock({ label = "Loading...", className }) {
  return (
    <div
      className={cx(
        "flex items-center justify-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-12 text-sm text-slate-500 dark:text-slate-400 shadow-card",
        className
      )}
    >
      <Spinner />
      {label}
    </div>
  );
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-6 py-8 text-center">
      <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
        Could not load this data
      </p>
      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
