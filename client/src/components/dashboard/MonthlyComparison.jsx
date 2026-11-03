import { Sunrise, Sunset } from "lucide-react";
import { Card } from "../ui/Card";
import { formatCurrency, formatKg, formatMann, formatPercent } from "../../utils/format";
import { formatMonthYear } from "../../utils/dates";

export function MonthlyComparison({ month, year, milk }) {
  const rows = [
    {
      key: "morning",
      label: "Morning",
      icon: Sunrise,
      data: milk.morning,
      color: "bg-brand-500",
      text: "text-brand-700 dark:text-brand-300",
      chip: "bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300",
    },
    {
      key: "evening",
      label: "Evening",
      icon: Sunset,
      data: milk.evening,
      color: "bg-violet-500",
      text: "text-violet-700 dark:text-violet-300",
      chip: "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300",
    },
  ];

  const totalAmount = milk.morning.amount + milk.evening.amount;

  return (
    <Card className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Morning vs Evening
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatMonthYear(month, year)} comparison
          </p>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
          {formatCurrency(totalAmount)} total
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          const share =
            totalAmount > 0 ? (row.data.amount / totalAmount) * 100 : 0;
          return (
            <div
              key={row.key}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-4"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${row.chip}`}
                >
                  <Icon size={16} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {formatPercent(share).toFixed(0)}% of amount
                </span>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {row.label} amount
              </p>
              <p className={`text-xl font-bold ${row.text}`}>
                {formatCurrency(row.data.amount)}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${Math.min(100, share)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{formatKg(row.data.kg)}</span>
                <span>{formatMann(row.data.mann)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
