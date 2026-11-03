import { CalendarRange, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { MONTH_NAMES } from "../../utils/dates";
import { formatCurrency, formatNumber } from "../../utils/format";
import { cx } from "../../utils/cx";

export function YearOverview({ year, months, selectedMonth, onSelect, loading }) {
  return (
    <Card>
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            <CalendarRange size={16} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Monthly history · {year}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a month to view its daily records
            </p>
          </div>
        </div>
        {loading ? <Spinner size={16} /> : null}
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((month) => {
          const selected = month.month === selectedMonth;
          return (
            <button
              key={month.month}
              type="button"
              onClick={() => onSelect(month.month)}
              className={cx(
                "group rounded-xl border p-3 text-left transition",
                selected
                  ? "border-brand-300 dark:border-brand-500/40 bg-brand-50/70 dark:bg-brand-500/10 ring-1 ring-brand-200 dark:ring-brand-400/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <div className="flex items-center justify-between">
                <p
                  className={cx(
                    "text-xs font-semibold",
                    selected ? "text-brand-700 dark:text-brand-300" : "text-slate-700 dark:text-slate-300"
                  )}
                >
                  {MONTH_NAMES[month.month - 1]}
                </p>
                <ChevronRight
                  size={14}
                  className={cx(
                    "transition group-hover:translate-x-0.5",
                    selected ? "text-brand-500" : "text-slate-300"
                  )}
                />
              </div>
              <p className="mt-1.5 text-base font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(month.amount)}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                <span>Morning {formatCurrency(month.morningAmount)}</span>
                <span>Evening {formatCurrency(month.eveningAmount)}</span>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {formatNumber(month.kg)} kg total
              </p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
