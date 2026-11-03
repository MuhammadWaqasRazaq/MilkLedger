import { Card } from "../ui/Card";
import { formatCurrency, formatNumber } from "../../utils/format";

export function YearlyTotals({ yearly }) {
  const items = [
    { label: "Total milk", value: `${formatNumber(yearly.totals.kg)} kg` },
    { label: "Total Mann", value: `${formatNumber(yearly.totals.mann)}` },
    { label: "Combined amount", value: formatCurrency(yearly.totals.amount) },
    { label: "Morning amount", value: formatCurrency(yearly.totals.morningAmount) },
    { label: "Evening amount", value: formatCurrency(yearly.totals.eveningAmount) },
    {
      label: "Days recorded",
      value: `${formatNumber(yearly.totals.daysWithRecords)}`,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {yearly.year} year at a glance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All milk records for the selected year
          </p>
        </div>
        <span className="rounded-full bg-brand-50 dark:bg-brand-500/10 px-3 py-1 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
          Morning + Evening
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {item.label}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{item.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
