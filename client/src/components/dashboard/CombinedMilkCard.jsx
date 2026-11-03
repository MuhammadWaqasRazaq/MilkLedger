import { Milk, Scale, Weight } from "lucide-react";
import { Card } from "../ui/Card";
import { formatCurrency, formatNumber, formatPercent } from "../../utils/format";

export function CombinedMilkCard({ combined }) {
  const paidPercent =
    combined.amount > 0 ? (combined.paid / combined.amount) * 100 : 0;

  const metrics = [
    {
      label: "Combined milk",
      value: `${formatNumber(combined.kg)} kg`,
      icon: Weight,
    },
    {
      label: "Total Mann",
      value: `${formatNumber(combined.mann)} Mann`,
      icon: Milk,
    },
    {
      label: "Combined amount",
      value: formatCurrency(combined.amount),
      icon: Scale,
    },
  ];

  return (
    <Card className="relative overflow-hidden border-0 bg-slate-900 text-white shadow-lg dark:bg-slate-800 dark:ring-1 dark:ring-slate-700">
      <div className="pointer-events-none absolute -right-8 -top-10 text-white/5">
        <Milk size={170} strokeWidth={1} />
      </div>
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-300">
              Total milk · Morning + Evening
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Combined summary
            </h2>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-200 ring-1 ring-inset ring-white/15">
            {formatPercent(paidPercent).toFixed(0)}% paid
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-200">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {metric.label}
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-white sm:text-xl">
                    {metric.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${Math.min(100, paidPercent)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
            <span>Paid {formatCurrency(combined.paid)}</span>
            <span>Remaining {formatCurrency(combined.remaining)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
