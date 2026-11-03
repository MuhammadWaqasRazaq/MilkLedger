import { Card } from "./Card";
import { cx } from "../../utils/cx";

const TONES = {
  blue: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-100 dark:ring-brand-500/20",
  violet: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-100 dark:ring-violet-500/20",
  green: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-100 dark:ring-emerald-500/20",
  red: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-100 dark:ring-rose-500/20",
  amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-100 dark:ring-amber-500/20",
  slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 ring-slate-200 dark:ring-slate-700",
};

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "blue",
  badge,
  className,
}) {
  return (
    <Card className={cx("p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {Icon ? (
          <span
            className={cx(
              "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
              TONES[tone] || TONES.blue
            )}
          >
            <Icon size={17} />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        {value}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {sub ? <p className="text-xs text-slate-500 dark:text-slate-400">{sub}</p> : null}
        {badge}
      </div>
    </Card>
  );
}
