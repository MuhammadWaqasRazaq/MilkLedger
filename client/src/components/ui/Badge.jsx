import { cx } from "../../utils/cx";

const TONES = {
  green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-600/20 dark:ring-emerald-400/20",
  red: "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-600/20 dark:ring-rose-400/20",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-600/20 dark:ring-amber-400/20",
  blue: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300 ring-brand-600/20 dark:ring-brand-400/20",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-500/20",
  violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-violet-600/20 dark:ring-violet-400/20",
};

export function Badge({ children, tone = "slate", className }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        TONES[tone] || TONES.slate,
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  if (status === "completed") {
    return <Badge tone="green">Completed</Badge>;
  }
  return <Badge tone="amber">Pending</Badge>;
}
