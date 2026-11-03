import { cx } from "../../utils/cx";
import { formatPercent } from "../../utils/format";

const TONES = {
  green: "bg-emerald-500",
  blue: "bg-brand-500",
  violet: "bg-violet-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
};

export function ProgressBar({ value, max, tone = "green", className }) {
  const percent = max > 0 ? formatPercent((value / max) * 100) : 0;
  return (
    <div
      className={cx(
        "h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
        className
      )}
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx("h-full rounded-full transition-all", TONES[tone] || TONES.green)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
