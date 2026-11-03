import { Sunrise, Sunset } from "lucide-react";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { formatCurrency, formatKg, formatMann } from "../../utils/format";
import { cx } from "../../utils/cx";

const TONES = {
  morning: {
    icon: Sunrise,
    iconClass: "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-brand-100 dark:ring-brand-500/20",
    accent: "text-brand-700 dark:text-brand-300",
    bar: "blue",
  },
  evening: {
    icon: Sunset,
    iconClass: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 ring-violet-100 dark:ring-violet-500/20",
    accent: "text-violet-700 dark:text-violet-300",
    bar: "violet",
  },
};

export function MilkBuyerCard({ buyerType, label, data }) {
  const tone = TONES[buyerType] || TONES.morning;
  const Icon = tone.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cx(
              "flex h-10 w-10 items-center justify-center rounded-xl ring-1",
              tone.iconClass
            )}
          >
            <Icon size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label} buyer</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Milk summary this month</p>
          </div>
        </div>
        <StatusBadge status={data.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total milk
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatKg(data.kg)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatMann(data.mann)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total amount
          </p>
          <p className={cx("mt-0.5 text-xl font-bold", tone.accent)}>
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Before payments</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 dark:bg-slate-950 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Paid
          </p>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(data.paid)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Remaining
          </p>
          <p
            className={cx(
              "text-sm font-semibold",
              data.remaining > 0 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300"
            )}
          >
            {formatCurrency(data.remaining)}
          </p>
        </div>
      </div>
      <ProgressBar
        value={data.paid}
        max={data.amount}
        tone={tone.bar}
        className="mt-3"
      />
    </Card>
  );
}
