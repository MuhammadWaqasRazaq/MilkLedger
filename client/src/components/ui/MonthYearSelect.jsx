import { CalendarDays } from "lucide-react";
import { MONTH_NAMES, yearOptions } from "../../utils/dates";
import { cx } from "../../utils/cx";

export function MonthYearSelect({
  month,
  year,
  onChange,
  className,
  compact = false,
}) {
  const years = yearOptions(new Date().getFullYear());
  if (!years.includes(Number(year))) {
    years.unshift(Number(year));
  }

  function update(next) {
    onChange({
      month: next.month !== undefined ? Number(next.month) : Number(month),
      year: next.year !== undefined ? Number(next.year) : Number(year),
    });
  }

  return (
    <div
      className={cx(
        "flex w-full items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:inline-flex sm:w-auto",
        className
      )}
    >
      <span className="ml-1.5 shrink-0 text-slate-400">
        <CalendarDays size={17} />
      </span>
      <select
        aria-label="Month"
        value={month}
        onChange={(event) => update({ month: event.target.value })}
        className="min-h-11 min-w-0 flex-1 cursor-pointer rounded-lg border-0 bg-transparent py-2.5 pl-1 pr-6 text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-slate-300 sm:min-h-0 sm:flex-none sm:py-1.5 sm:text-sm"
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {compact ? name.slice(0, 3) : name}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        value={year}
        onChange={(event) => update({ year: event.target.value })}
        className="min-h-11 cursor-pointer rounded-lg border-0 bg-transparent py-2.5 pl-1 pr-6 text-base font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:text-slate-300 sm:min-h-0 sm:py-1.5 sm:text-sm"
      >
        {years.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}
